package com.example.backend.controller.admin;

import com.example.backend.module.Order;
import com.example.backend.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminOrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private AdminOrderController adminOrderController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminOrderController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetAllOrders_WithFilters() throws Exception {
        Order o = Order.builder()
                .id("ord-1")
                .orderCode("ORD123")
                .orderStatus("PENDING")
                .totalAmount(250000L)
                .build();

        when(orderService.getAllOrders(eq("PENDING"), any(), any(), eq("shop-1"), eq("buyer-1"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(o), org.springframework.data.domain.PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/admin/orders")
                        .param("orderStatus", "PENDING")
                        .param("shopId", "shop-1")
                        .param("buyerId", "buyer-1")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("ord-1"))
                .andExpect(jsonPath("$.content[0].orderCode").value("ORD123"))
                .andExpect(jsonPath("$.content[0].orderStatus").value("PENDING"));
    }

    @Test
    void testCancelExpiredOrders_Trigger() throws Exception {
        when(orderService.cancelExpiredPendingOrders(15)).thenReturn(3);

        mockMvc.perform(post("/admin/orders/cancel-expired")
                        .param("minutes", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.canceledCount").value(3));
    }
}
