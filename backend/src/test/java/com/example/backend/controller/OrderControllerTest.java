package com.example.backend.controller;

import com.example.backend.module.Order;
import com.example.backend.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class OrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController).build();
    }

    @Test
    void testConfirmReceived_Success() throws Exception {
        Order order = Order.builder()
                .id("ord-123")
                .buyerId("user-1")
                .shopId("shop-1")
                .orderStatus("COMPLETED")
                .build();

        when(orderService.confirmReceived(eq("ord-123"), eq("user-1"))).thenReturn(order);

        mockMvc.perform(patch("/orders/ord-123/confirm-received")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\": \"user-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ord-123"))
                .andExpect(jsonPath("$.orderStatus").value("COMPLETED"));
    }
}
