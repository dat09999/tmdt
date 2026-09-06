package com.example.backend.service;

import com.example.backend.DTO.coupon.CreateCouponRequest;
import com.example.backend.module.Coupon;

import java.util.List;

public interface CouponService {
    Coupon createCoupon(CreateCouponRequest request);
    List<Coupon> getActiveCoupons();
    List<Coupon> getCouponsByShop(String shopId);
    Coupon validateCoupon(String code, Long orderValue);
    Coupon deactivateCoupon(String couponId);

    // Admin lấy toàn bộ coupon có lọc theo scope (GLOBAL / SHOP) và active
    org.springframework.data.domain.Page<Coupon> getAllCoupons(
            String scope,
            Boolean active,
            org.springframework.data.domain.Pageable pageable
    );

    // BUG FIX: Tăng usedCount nguyên tử kèm điều kiện usedCount < usageLimit
    boolean incrementUsedCountAtomic(String code);
}
