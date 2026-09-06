package com.example.backend.service;

import com.example.backend.DTO.admin.AdminOverviewResponse;
import com.example.backend.DTO.admin.TopShopResponse;
import com.example.backend.DTO.shop.DailyRevenueResponse;
import com.example.backend.DTO.shop.OrderStatusDistributionResponse;
import com.example.backend.DTO.shop.TopProductResponse;

import java.util.List;

public interface AdminAnalyticsService {

    AdminOverviewResponse getOverview();

    List<DailyRevenueResponse> getRevenueAnalytics(String startDate, String endDate, Integer days);

    List<TopShopResponse> getTopShops(int limit);

    List<TopProductResponse> getTopSellingProducts(int limit);

    OrderStatusDistributionResponse getOrderStatusDistribution();
}
