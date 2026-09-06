package com.example.backend.service.impl;

import com.example.backend.DTO.coupon.CreateCouponRequest;
import com.example.backend.module.Coupon;
import com.example.backend.repository.CouponRepository;
import com.example.backend.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #14 createCoupon(): check "code đã tồn tại chưa" rồi mới save() là TOCTOU - 2 admin tạo
 *      cùng code gần như đồng thời có thể cùng đọc "chưa tồn tại" -> cùng insert thành công.
 *      Fix: vẫn giữ check sớm để báo lỗi nhanh cho UX, NHƯNG bắt buộc phải có unique index
 *      trên field `code` ở tầng DB (@Indexed(unique = true) trong model Coupon) - đây mới là
 *      nguồn đảm bảo thật sự. Code bắt thêm DuplicateKeyException để báo lỗi thân thiện nếu
 *      race condition lọt qua check sớm.
 *
 *      QUAN TRỌNG: bạn cần thêm annotation sau vào field `code` trong Coupon.java:
 *          @Indexed(unique = true)
 *          private String code;
 *      Nếu không có unique index này, DB sẽ không tự chặn được insert trùng, và fix này
 *      chỉ còn tác dụng "giảm khả năng xảy ra" chứ không loại bỏ hoàn toàn được race.
 *
 *  #15 deactivateCoupon(): đọc-sửa-ghi TOÀN BỘ document là lỗi nghiêm trọng nhất tìm thấy ở
 *      file này - nó xung đột trực tiếp với OrderServiceImpl.markPaymentSuccess(), nơi
 *      usedCount được cộng ATOMIC bằng $inc. Nếu admin tắt coupon đúng lúc có đơn hàng vừa
 *      thanh toán xong dùng coupon đó, việc save() cả document ở đây sẽ ghi đè mất giá trị
 *      usedCount vừa được cộng atomic. Fix: đổi sang atomic $set chỉ trên field `active`,
 *      không đụng tới field nào khác.
 */
@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Coupon createCoupon(CreateCouponRequest request) {
        String code = normalizeCode(request.getCode());

        // Check sớm để báo lỗi nhanh cho UX - KHÔNG phải nguồn đảm bảo an toàn duy nhất,
        // nguồn thật sự là unique index ở DB (xem ghi chú DuplicateKeyException bên dưới).
        if (couponRepository.findByCode(code).isPresent()) {
            throw new RuntimeException("Coupon đã tồn tại");
        }

        if (!"PERCENT".equalsIgnoreCase(request.getDiscountType())
                && !"FIXED".equalsIgnoreCase(request.getDiscountType())) {
            throw new RuntimeException("discountType phải là PERCENT hoặc FIXED");
        }

        if (request.getDiscountValue() == null || request.getDiscountValue() < 0) {
            throw new RuntimeException("discountValue phải >= 0");
        }

        if ("PERCENT".equalsIgnoreCase(request.getDiscountType()) && request.getDiscountValue() > 100) {
            throw new RuntimeException("discountValue phần trăm không được lớn hơn 100");
        }

        String scope = request.getShopId() != null ? "SHOP" : "PLATFORM";
        if (request.getScope() != null && !request.getScope().isBlank()) {
            scope = request.getScope().trim().toUpperCase();
        }

        Coupon coupon = Coupon.builder()
                .shopId(request.getShopId())
                .scope(scope)
                .code(code)
                .discountType(request.getDiscountType().trim().toUpperCase())
                .discountValue(request.getDiscountValue())
                .minOrderValue(request.getMinOrderValue() == null ? 0L : request.getMinOrderValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .applicableProductIds(request.getApplicableProductIds())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .usageLimitPerUser(request.getUsageLimitPerUser())
                .usedCount(0)
                .active(true)
                .createdAt(new Date())
                .build();

        try {
            return couponRepository.save(coupon);
        } catch (DuplicateKeyException ex) {
            // Race condition lọt qua check sớm ở trên -> unique index ở DB chặn lại.
            // Đây là lưới an toàn thật sự, check ở đầu hàm chỉ để fail nhanh cho UX.
            throw new RuntimeException("Coupon đã tồn tại");
        }
    }

    @Override
    public List<Coupon> getActiveCoupons() {
        return couponRepository.findByActiveTrue();
    }

    @Override
    public List<Coupon> getCouponsByShop(String shopId) {
        return couponRepository.findByShopIdAndActiveTrue(shopId);
    }

    @Override
    public Coupon validateCoupon(String code, Long orderValue) {
        Coupon coupon = couponRepository.findByCode(normalizeCode(code))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy coupon"));
        validateCouponData(coupon, orderValue == null ? 0L : orderValue);
        return coupon;
    }

    @Override
    public Coupon deactivateCoupon(String couponId) {
        // FIX #15: atomic $set chỉ trên field "active", KHÔNG đọc rồi ghi đè cả document.
        // Nhờ vậy dù usedCount đang được OrderServiceImpl cộng atomic ở đúng thời điểm này,
        // giá trị đó vẫn được giữ nguyên, không bị ghi đè mất.
        Query query = Query.query(Criteria.where("_id").is(couponId));
        Update update = new Update().set("active", false);

        Coupon result = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Coupon.class);

        if (result == null) {
            throw new RuntimeException("Không tìm thấy coupon");
        }
        return result;
    }

    private void validateCouponData(Coupon coupon, Long orderValue) {
        Date now = new Date();
        if (!Boolean.TRUE.equals(coupon.getActive())) throw new RuntimeException("Coupon không còn hoạt động");
        if (coupon.getStartDate() != null && now.before(coupon.getStartDate())) throw new RuntimeException("Coupon chưa đến thời gian sử dụng");
        if (coupon.getEndDate() != null && now.after(coupon.getEndDate())) throw new RuntimeException("Coupon đã hết hạn");
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) throw new RuntimeException("Coupon đã hết lượt sử dụng");
        long min = coupon.getMinOrderValue() == null ? 0L : coupon.getMinOrderValue();
        if (orderValue < min) throw new RuntimeException("Đơn hàng chưa đủ giá trị tối thiểu để áp coupon");
    }

    private String normalizeCode(String code) {
        if (code == null || code.trim().isBlank()) throw new RuntimeException("code không được để trống");
        return code.trim().toUpperCase();
    }

    @Override
    public Page<Coupon> getAllCoupons(String scope, Boolean active, Pageable pageable) {
        Query query = new Query();
        if (scope != null && !scope.isBlank()) {
            query.addCriteria(Criteria.where("scope").is(scope.trim().toUpperCase()));
        }
        if (active != null) {
            query.addCriteria(Criteria.where("active").is(active));
        }

        long total = mongoTemplate.count(query, Coupon.class);
        query.with(pageable);
        List<Coupon> list = mongoTemplate.find(query, Coupon.class);
        return new PageImpl<>(list, pageable, total);
    }

    @Override
    public boolean incrementUsedCountAtomic(String code) {
        if (code == null || code.isBlank()) return false;
        String normalized = normalizeCode(code);

        // Điều kiện atomic: code khớp AND active == true AND (usageLimit == null OR usedCount < usageLimit)
        Query query = new Query(
                Criteria.where("code").is(normalized)
                        .and("active").is(true)
                        .orOperator(
                                Criteria.where("usageLimit").is(null),
                                Criteria.where("usageLimit").exists(false),
                                Criteria.where("$expr").is(new org.bson.Document("$lt", List.of(
                                        new org.bson.Document("$ifNull", List.of("$usedCount", 0)),
                                        "$usageLimit"
                                )))
                        )
        );

        Update update = new Update().inc("usedCount", 1);
        Coupon updated = mongoTemplate.findAndModify(query, update, FindAndModifyOptions.options().returnNew(true), Coupon.class);
        return updated != null;
    }
}