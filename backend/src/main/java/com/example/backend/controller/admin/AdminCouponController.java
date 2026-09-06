package com.example.backend.controller.admin;

import com.example.backend.module.Coupon;
import com.example.backend.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Coupons", description = "API quản trị mã giảm giá toàn hệ thống")
@RestController
@RequestMapping("/admin/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    @Operation(summary = "Xem toàn bộ mã giảm giá toàn sàn (gồm cả active và inactive, lọc theo scope và trạng thái)")
    @GetMapping
    public ResponseEntity<Page<Coupon>> getAllCoupons(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(couponService.getAllCoupons(scope, active, pageable));
    }
}
