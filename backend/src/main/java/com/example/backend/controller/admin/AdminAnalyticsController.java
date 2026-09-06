package com.example.backend.controller.admin;

import com.example.backend.DTO.admin.AdminOverviewResponse;
import com.example.backend.DTO.admin.TopShopResponse;
import com.example.backend.DTO.shop.DailyRevenueResponse;
import com.example.backend.DTO.shop.OrderStatusDistributionResponse;
import com.example.backend.DTO.shop.TopProductResponse;
import com.example.backend.service.AdminAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin - Analytics", description = "API thống kê, báo cáo và dashboard toàn hệ thống")
@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @Operation(summary = "Tổng quan số liệu toàn hệ thống (Doanh thu, Đơn hàng, Users, Shops, Hôm nay)")
    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminAnalyticsService.getOverview());
    }

    @Operation(summary = "Biểu đồ doanh thu và số đơn hàng theo ngày toàn hệ thống")
    @GetMapping("/revenue")
    public ResponseEntity<List<DailyRevenueResponse>> getRevenueAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "10") int days) {
        return ResponseEntity.ok(adminAnalyticsService.getRevenueAnalytics(startDate, endDate, days));
    }

    @Operation(summary = "Top shop đạt doanh thu và số đơn hàng cao nhất toàn sàn")
    @GetMapping("/top-shops")
    public ResponseEntity<List<TopShopResponse>> getTopShops(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(adminAnalyticsService.getTopShops(limit));
    }

    @Operation(summary = "Top sản phẩm bán chạy nhất toàn sàn")
    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopSellingProducts(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(adminAnalyticsService.getTopSellingProducts(limit));
    }

    @Operation(summary = "Phân bố trạng thái đơn hàng toàn hệ thống (Pie/Donut chart)")
    @GetMapping("/order-status")
    public ResponseEntity<OrderStatusDistributionResponse> getOrderStatusDistribution() {
        return ResponseEntity.ok(adminAnalyticsService.getOrderStatusDistribution());
    }
}
