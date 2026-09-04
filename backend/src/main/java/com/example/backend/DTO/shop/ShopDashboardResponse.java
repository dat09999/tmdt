package com.example.backend.DTO.shop;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopDashboardResponse {
    private ShopStatisticsResponse summary;
    private List<DailyRevenueResponse> revenueChart;
    private OrderStatusDistributionResponse orderStatusDistribution;
    private List<TopProductResponse> topProducts;
    private List<LowStockResponse> lowStockAlerts;
}