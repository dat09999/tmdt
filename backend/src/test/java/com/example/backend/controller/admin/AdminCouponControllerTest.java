package com.example.backend.controller.admin;

import com.example.backend.module.Coupon;
import com.example.backend.service.CouponService;
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
public class AdminCouponControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CouponService couponService;

    @InjectMocks
    private AdminCouponController adminCouponController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminCouponController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetAllCoupons_WithScopeAndActive() throws Exception {
        Coupon c = Coupon.builder()
                .id("cp-1")
                .code("SUMMER2026")
                .scope("GLOBAL")
                .active(false)
                .usedCount(5)
                .usageLimit(100)
                .build();

        when(couponService.getAllCoupons(eq("GLOBAL"), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(c), org.springframework.data.domain.PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/admin/coupons")
                        .param("scope", "GLOBAL")
                        .param("active", "false")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("cp-1"))
                .andExpect(jsonPath("$.content[0].code").value("SUMMER2026"))
                .andExpect(jsonPath("$.content[0].active").value(false));
    }
}
