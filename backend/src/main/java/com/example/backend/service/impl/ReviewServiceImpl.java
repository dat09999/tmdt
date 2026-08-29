package com.example.backend.service.impl;

import com.example.backend.DTO.review.RatingSummary;
import com.example.backend.DTO.review.ReviewRequest;
import com.example.backend.DTO.review.ReviewResponse;
import com.example.backend.module.Order;
import com.example.backend.module.Review;
import com.example.backend.module.User;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;

import com.example.backend.repository.Reviewrepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #19 createReview(): check "đã đánh giá chưa" rồi mới save() là TOCTOU - double-click gửi
 *      đánh giá có thể tạo ra 2 review trùng cho cùng 1 order+product+user. Fix: bắt thêm
 *      DuplicateKeyException, NHƯNG cần bạn thêm unique compound index vào model Review:
 *          @CompoundIndex(name = "uniq_order_product_user", def = "{'orderId': 1, 'productId': 1, 'userId': 1}", unique = true)
 *      Đây mới là nguồn đảm bảo thật, code chỉ bắt lỗi để báo thân thiện khi race xảy ra.
 *
 *  #20 markHelpful(): đúng như comment cũ trong code đã tự nhận ra - đổi sang atomic $inc.
 *
 *  #21 (NGHIÊM TRỌNG) recalculateProductRating(): đọc TOÀN BỘ document Product (gồm cả
 *      variants/stock) rồi save() cả document - TÁI PHÁT đúng lỗi đã sửa ở
 *      ProductServiceImpl.updateProduct() (#12), lần này đến từ luồng Review. Nếu đúng lúc
 *      review được tạo/ẩn, có đơn hàng khác đang decrementStockAtomic() cho cùng sản phẩm,
 *      việc save() cả document ở đây sẽ ghi đè mất thay đổi tồn kho vừa xảy ra. Fix: đổi
 *      sang atomic $set chỉ trên 2 field "rating" và "totalReviews", không đụng vào field
 *      nào khác của Product.
 *
 *  replyToReview() và hideReview(): cũng đổi sang atomic $set cho nhất quán, dù rủi ro thấp
 *      hơn (thường chỉ 1 admin/shop thao tác, ít khi trùng thời điểm).
 */
// chay
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final Reviewrepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public ReviewResponse createReview(String userId, ReviewRequest request) {
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating phải từ 1 đến 5 sao");
        }

        // ── Xác minh "đã mua hàng" ──
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng"));

        if (!order.getBuyerId().equals(userId)) {
            throw new IllegalArgumentException("Đơn hàng không thuộc về bạn");
        }

        if (!"DELIVERED".equalsIgnoreCase(String.valueOf(order.getOrderStatus()))) {
            throw new IllegalStateException("Đơn hàng chưa giao thành công, chưa thể đánh giá");
        }

        boolean productInOrder = order.getItems().stream()
                .anyMatch(item -> item.getProductId().equals(request.getProductId()));
        if (!productInOrder) {
            throw new IllegalArgumentException("Sản phẩm không nằm trong đơn hàng này");
        }

        // ── Chống đánh giá trùng ──
        // Check sớm để báo lỗi nhanh cho UX - nguồn đảm bảo thật sự là unique compound
        // index ở DB (xem ghi chú DuplicateKeyException bên dưới).
        boolean alreadyReviewed = reviewRepository.existsByOrderIdAndProductIdAndUserId(
                request.getOrderId(), request.getProductId(), userId);
        if (alreadyReviewed) {
            throw new IllegalStateException("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));

        Review review = Review.builder()
                .productId(request.getProductId())
                .orderId(request.getOrderId())
                .variantSku(request.getVariantSku())
                .userId(userId)
                .userName(user.getFullName())
                .rating(request.getRating())
                .comment(request.getComment())
                .imageUrls(request.getImageUrls())
                .helpfulCount(0)
                .visible(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        try {
            review = reviewRepository.save(review);
        } catch (DuplicateKeyException ex) {
            // Race condition lọt qua check exists() ở trên -> unique index chặn lại.
            throw new IllegalStateException("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi");
        }

        recalculateProductRating(request.getProductId());

        return ReviewResponse.fromEntity(review);
    }


    @Override
    public Page<ReviewResponse> getReviewsByProduct(String productId, int page, int size) {
        Page<Review> reviews = reviewRepository.findByProductIdAndVisibleTrue(
                productId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return reviews.map(ReviewResponse::fromEntity);
    }

    @Override
    public RatingSummary getRatingSummary(String productId) {
        // Cách đơn giản: lấy toàn bộ rating của sản phẩm rồi tính trong Java.
        // Đủ dùng ở quy mô đồ án; nếu sau này số review lớn (chục nghìn+),
        // nên chuyển sang MongoDB aggregation pipeline ($group + $avg) để đỡ tải bộ nhớ.
        List<Review> visibleReviews = reviewRepository
                .findByProductIdAndVisibleTrue(productId, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        long total = visibleReviews.size();
        double avg = visibleReviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        Map<Integer, Long> breakdown = new HashMap<>();
        for (int star = 1; star <= 5; star++) {
            final int s = star;
            breakdown.put(s, visibleReviews.stream().filter(r -> r.getRating() == s).count());
        }

        return RatingSummary.builder()
                .avgRating(Math.round(avg * 10.0) / 10.0) // làm tròn 1 chữ số thập phân
                .totalReviews(total)
                .starBreakdown(breakdown)
                .build();
    }

    @Override
    public ReviewResponse replyToReview(String reviewId, String replyContent) {
        // Đổi sang atomic $set cho nhất quán, không đọc-sửa-ghi cả document Review.
        Query query = Query.query(Criteria.where("_id").is(reviewId));
        Update update = new Update()
                .set("shopReply", Review.ReviewReply.builder()
                        .content(replyContent)
                        .repliedAt(LocalDateTime.now())
                        .build())
                .set("updatedAt", LocalDateTime.now());

        Review updated = mongoTemplate.findAndModify(query, update,
                org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true), Review.class);

        if (updated == null) {
            throw new IllegalArgumentException("Không tìm thấy đánh giá");
        }
        return ReviewResponse.fromEntity(updated);
    }

    @Override
    public void markHelpful(String reviewId) {
        // FIX #20: atomic $inc thay vì đọc-cộng-ghi. Nhiều người bấm "hữu ích" cùng lúc
        // giờ sẽ được MongoDB tự cộng dồn đúng, không còn mất lượt đếm.
        Query query = Query.query(Criteria.where("_id").is(reviewId));
        Update update = new Update().inc("helpfulCount", 1);

        var result = mongoTemplate.updateFirst(query, update, Review.class);
        if (result.getMatchedCount() == 0) {
            throw new IllegalArgumentException("Không tìm thấy đánh giá");
        }
    }

    @Override
    public void hideReview(String reviewId) {
        // Đổi sang atomic $set thay vì đọc-sửa-ghi cả document Review.
        Query query = Query.query(Criteria.where("_id").is(reviewId));
        Update update = new Update().set("visible", false);

        Review updated = mongoTemplate.findAndModify(query, update,
                org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true), Review.class);

        if (updated == null) {
            throw new IllegalArgumentException("Không tìm thấy đánh giá");
        }

        recalculateProductRating(updated.getProductId());
    }

    // ── Cập nhật ngược lại avgRating/reviewCount trên Product để trang chi tiết
    //    sản phẩm không phải aggregate qua collection reviews mỗi lần load ──
    /**
     * FIX #21 (NGHIÊM TRỌNG): trước đây hàm này đọc TOÀN BỘ document Product rồi save() cả
     * document - nếu đúng lúc này có đơn hàng khác đang atomic trừ tồn kho cho cùng sản
     * phẩm (decrementStockAtomic ở OrderServiceImpl), việc save() ở đây sẽ ghi đè mất thay
     * đổi tồn kho đó, TÁI PHÁT đúng lỗi #12 đã sửa ở ProductServiceImpl.updateProduct().
     *
     * Giờ chỉ atomic $set đúng 2 field "rating" và "totalReviews", tuyệt đối không đụng
     * tới field nào khác (đặc biệt là "variants"/"stock") của Product.
     */
    private void recalculateProductRating(String productId) {
        RatingSummary summary = getRatingSummary(productId);

        Query query = Query.query(Criteria.where("id").is(productId));
        Update update = new Update()
                .set("rating", summary.getAvgRating())
                .set("totalReviews", Math.toIntExact(summary.getTotalReviews()));

        mongoTemplate.updateFirst(query, update, com.example.backend.module.Product.class);
    }
}