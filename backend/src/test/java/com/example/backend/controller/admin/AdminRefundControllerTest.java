package com.example.backend.controller.admin;

import com.example.backend.module.RefundRequest;
import com.example.backend.service.RefundRequestService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminRefundControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RefundRequestService refundRequestService;

    @InjectMocks
    private AdminRefundController adminRefundController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminRefundController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetAllRefunds_WithStatusFilter() throws Exception {
        RefundRequest r = RefundRequest.builder()
                .id("ref-1")
                .orderId("ord-1")
                .userId("user-1")
                .status("PENDING")
                .reason("Hàng lỗi")
                .build();

        when(refundRequestService.getAllRefundRequests(eq("PENDING"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(r), org.springframework.data.domain.PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/admin/refunds")
                        .param("status", "PENDING")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("ref-1"))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.content[0].reason").value("Hàng lỗi"));
    }
}
