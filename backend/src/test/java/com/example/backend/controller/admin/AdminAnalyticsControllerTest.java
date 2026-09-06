package com.example.backend.controller.admin;

import com.example.backend.DTO.admin.AdminOverviewResponse;
import com.example.backend.DTO.admin.TopShopResponse;
import com.example.backend.DTO.shop.DailyRevenueResponse;
import com.example.backend.DTO.shop.OrderStatusDistributionResponse;
import com.example.backend.DTO.shop.TopProductResponse;
import com.example.backend.service.AdminAnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminAnalyticsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminAnalyticsService adminAnalyticsService;

    @InjectMocks
    private AdminAnalyticsController adminAnalyticsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminAnalyticsController).build();
    }

    @Test
    void testGetOverview() throws Exception {
        AdminOverviewResponse resp = AdminOverviewResponse.builder()
                .totalRevenue(50000000L)
                .totalOrders(120)
                .totalUsers(45)
                .totalShops(12)
                .activeShops(10)
                .build();

        when(adminAnalyticsService.getOverview()).thenReturn(resp);

        mockMvc.perform(get("/admin/analytics/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").value(50000000L))
                .andExpect(jsonPath("$.totalOrders").value(120))
                .andExpect(jsonPath("$.totalUsers").value(45))
                .andExpect(jsonPath("$.totalShops").value(12));
    }

    @Test
    void testGetRevenueAnalytics() throws Exception {
        DailyRevenueResponse item = DailyRevenueResponse.builder()
                .date("2026-09-01")
                .revenue(1500000L)
                .orderCount(5)
                .build();

        when(adminAnalyticsService.getRevenueAnalytics(null, null, 10)).thenReturn(List.of(item));

        mockMvc.perform(get("/admin/analytics/revenue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value("2026-09-01"))
                .andExpect(jsonPath("$[0].revenue").value(1500000L));
    }

    @Test
    void testGetTopShops() throws Exception {
        TopShopResponse shop = TopShopResponse.builder()
                .shopId("s1")
                .shopName("Shop Cong Nghe")
                .revenue(30000000L)
                .orderCount(80)
                .build();

        when(adminAnalyticsService.getTopShops(5)).thenReturn(List.of(shop));

        mockMvc.perform(get("/admin/analytics/top-shops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].shopId").value("s1"))
                .andExpect(jsonPath("$[0].shopName").value("Shop Cong Nghe"));
    }

    @Test
    void testGetTopProducts() throws Exception {
        TopProductResponse p = TopProductResponse.builder()
                .productId("p1")
                .productName("Chuot Gaming")
                .soldCount(150)
                .revenue(45000000L)
                .build();

        when(adminAnalyticsService.getTopSellingProducts(5)).thenReturn(List.of(p));

        mockMvc.perform(get("/admin/analytics/top-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productId").value("p1"))
                .andExpect(jsonPath("$[0].soldCount").value(150));
    }

    @Test
    void testGetOrderStatusDistribution() throws Exception {
        OrderStatusDistributionResponse dist = OrderStatusDistributionResponse.builder()
                .statusCounts(Map.of("COMPLETED", 50L, "PENDING", 10L))
                .totalOrders(60)
                .build();

        when(adminAnalyticsService.getOrderStatusDistribution()).thenReturn(dist);

        mockMvc.perform(get("/admin/analytics/order-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(60))
                .andExpect(jsonPath("$.statusCounts.COMPLETED").value(50));
    }
}
