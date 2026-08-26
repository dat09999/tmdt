package com.example.backend.controller;


import com.example.backend.DTO.review.RatingSummary;
import com.example.backend.DTO.review.ReviewRequest;
import com.example.backend.DTO.review.ReviewResponse;
import com.example.backend.module.User;
import com.example.backend.module.Review;
import com.example.backend.module.Product;
import com.example.backend.module.Shop;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.Reviewrepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;
    private final Reviewrepository reviewRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;

    // Đăng review mới — bắt buộc đăng nhập, chỉ được review đơn hàng của chính mình
    @PostMapping
    public ResponseEntity<?> createReview(Authentication authentication,
                                          @RequestBody ReviewRequest request) {
        try {
            String userId = currentUserId(authentication);
            ReviewResponse response = reviewService.createReview(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Danh sách review của 1 sản phẩm — public, không cần đăng nhập
    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<ReviewResponse>> getReviewsByProduct(
            @PathVariable String productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviewsByProduct(productId, page, size));
    }

    // Điểm trung bình + breakdown theo sao — public
    @GetMapping("/product/{productId}/summary")
    public ResponseEntity<RatingSummary> getRatingSummary(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(productId));
    }

    // Bấm "hữu ích" — bắt buộc đăng nhập (chặn spam ẩn danh)
    @PostMapping("/{reviewId}/helpful")
    public ResponseEntity<?> markHelpful(Authentication authentication,
                                         @PathVariable String reviewId) {
        currentUserId(authentication); // chỉ để bảo đảm đã đăng nhập
        reviewService.markHelpful(reviewId);
        return ResponseEntity.ok(Map.of("message", "Đã ghi nhận"));
    }

    // Shop sở hữu sản phẩm hoặc ADMIN được phản hồi review.
    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyToReview(Authentication authentication,
                                           @PathVariable String reviewId,
                                           @RequestBody Map<String, String> body) {
        requireReviewOwnerOrAdmin(authentication, reviewId);
        ReviewResponse response = reviewService.replyToReview(reviewId, body.get("content"));
        return ResponseEntity.ok(response);
    }

    // Ẩn review vi phạm — chỉ ADMIN
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> hideReview(Authentication authentication,
                                        @PathVariable String reviewId) {
        requireAdmin(authentication);
        reviewService.hideReview(reviewId);
        return ResponseEntity.ok(Map.of("message", "Đã ẩn đánh giá"));
    }

    // ── Helpers ──

    private String currentUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy user"));
        return user.getId();
    }

    private void requireAdmin(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy user"));
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Không có quyền thực hiện thao tác này");
        }
    }

    private void requireReviewOwnerOrAdmin(Authentication authentication, String reviewId) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy user"));
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            return;
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá"));
        Product product = productRepository.findById(review.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm"));
        Shop shop = shopRepository.findById(product.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy shop"));
        if (!user.getId().equals(shop.getOwnerId())) {
            throw new org.springframework.security.access.AccessDeniedException("Không có quyền phản hồi đánh giá này");
        }
    }
}
