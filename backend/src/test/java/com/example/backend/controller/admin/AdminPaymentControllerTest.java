package com.example.backend.controller.admin;

import com.example.backend.module.Order;
import com.example.backend.module.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminPaymentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private AdminPaymentController adminPaymentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminPaymentController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetPayments_AnomalyDetection() throws Exception {
        Payment payment = Payment.builder()
                .method("VNPAY")
                .status("PAID")
                .amount(500000L)
                .transactionCode("VNP123456")
                .paidAt(new Date())
                .build();

        Order order = Order.builder()
                .id("ord-99")
                .orderCode("ORD99")
                .orderStatus("CANCELED")
                .payment(payment)
                .build();

        when(mongoTemplate.count(any(Query.class), eq(Order.class))).thenReturn(1L);
        when(mongoTemplate.find(any(Query.class), eq(Order.class))).thenReturn(List.of(order));

        mockMvc.perform(get("/admin/payments")
                        .param("anomalyOnly", "true")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderId").value("ord-99"))
                .andExpect(jsonPath("$.content[0].paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.content[0].orderStatus").value("CANCELED"))
                .andExpect(jsonPath("$.content[0].anomaly").value(true));
    }
}
