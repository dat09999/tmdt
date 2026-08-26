package com.example.backend.controller;

import com.example.backend.DTO.coupon.CreateCouponRequest;
import com.example.backend.module.Coupon;
import com.example.backend.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    public ResponseEntity<Coupon> createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.createCoupon(request));
    }

    @GetMapping
    public ResponseEntity<List<Coupon>> getActiveCoupons() {
        return ResponseEntity.ok(couponService.getActiveCoupons());
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<Coupon>> getByShop(@PathVariable String shopId) {
        return ResponseEntity.ok(couponService.getCouponsByShop(shopId));
    }

    @GetMapping("/validate")
    public ResponseEntity<Coupon> validate(@RequestParam String code,
                                           @RequestParam Long orderValue) {
        return ResponseEntity.ok(couponService.validateCoupon(code, orderValue));
    }

    @PatchMapping("/{couponId}/deactivate")
    public ResponseEntity<Coupon> deactivate(@PathVariable String couponId) {
        return ResponseEntity.ok(couponService.deactivateCoupon(couponId));
    }
}
