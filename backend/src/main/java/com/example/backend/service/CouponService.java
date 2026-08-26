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
}
