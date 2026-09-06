package com.example.backend.controller.admin;

import com.example.backend.DTO.shop.ShopResponse;
import com.example.backend.service.ShopService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminShopControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ShopService shopService;

    @InjectMocks
    private AdminShopController adminShopController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminShopController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetAllShops_WithFilters() throws Exception {
        ShopResponse shop = ShopResponse.builder()
                .id("shop1")
                .shopName("Official Tech Store")
                .status("PENDING")
                .rating(4.8)
                .totalSales(150)
                .build();

        when(shopService.getAllShopsForAdmin(eq("PENDING"), eq("Tech"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(shop), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/admin/shops")
                        .param("status", "PENDING")
                        .param("keyword", "Tech")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("shop1"))
                .andExpect(jsonPath("$.content[0].shopName").value("Official Tech Store"))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }

    @Test
    void testApproveShop() throws Exception {
        ShopResponse approved = ShopResponse.builder()
                .id("shop1")
                .shopName("Official Tech Store")
                .status("ACTIVE")
                .build();

        when(shopService.approveShop("shop1")).thenReturn(approved);

        mockMvc.perform(post("/admin/shops/shop1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("shop1"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testSuspendShop() throws Exception {
        ShopResponse suspended = ShopResponse.builder()
                .id("shop1")
                .shopName("Official Tech Store")
                .status("BANNED")
                .build();

        when(shopService.banShop(eq("shop1"), anyString())).thenReturn(suspended);

        mockMvc.perform(post("/admin/shops/shop1/suspend")
                        .param("reason", "Gian lận"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("shop1"))
                .andExpect(jsonPath("$.status").value("BANNED"));
    }
}
