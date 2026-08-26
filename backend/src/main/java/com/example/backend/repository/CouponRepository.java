package com.example.backend.repository;

import com.example.backend.module.Coupon;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends MongoRepository<Coupon, String> {
    Optional<Coupon> findByCode(String code);
    List<Coupon> findByActiveTrue();
    List<Coupon> findByShopId(String shopId);
    List<Coupon> findByShopIdAndActiveTrue(String shopId);
    List<Coupon> findByShopIdIsNullAndActiveTrue(); // coupon toàn hệ thống
}
