package com.example.backend.controller.admin;

import com.example.backend.DTO.product.ProductResponse;
import com.example.backend.service.ProductService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @InjectMocks
    private AdminProductController adminProductController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminProductController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetAllProducts_WithFilters() throws Exception {
        ProductResponse prod = ProductResponse.builder()
                .id("prod-1")
                .name("Tai nghe Bluetooth")
                .status("ACTIVE")
                .basePrice(299000L)
                .build();

        when(productService.getAllProductsForAdmin(eq("Bluetooth"), eq("ACTIVE"), eq("shop-1"), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(prod), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/admin/products")
                        .param("keyword", "Bluetooth")
                        .param("status", "ACTIVE")
                        .param("shopId", "shop-1")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("prod-1"))
                .andExpect(jsonPath("$.content[0].name").value("Tai nghe Bluetooth"))
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
    }

    @Test
    void testApproveProduct() throws Exception {
        ProductResponse prod = ProductResponse.builder()
                .id("prod-2")
                .name("Giày Sneaker")
                .status("ACTIVE")
                .build();

        when(productService.approveProduct("prod-2")).thenReturn(prod);

        mockMvc.perform(post("/admin/products/prod-2/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("prod-2"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testBanProduct() throws Exception {
        ProductResponse prod = ProductResponse.builder()
                .id("prod-3")
                .name("Hàng giả")
                .status("BANNED")
                .build();

        when(productService.banProduct(eq("prod-3"), anyString())).thenReturn(prod);

        mockMvc.perform(post("/admin/products/prod-3/ban")
                        .param("reason", "Hàng cấm bán"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("prod-3"))
                .andExpect(jsonPath("$.status").value("BANNED"));
    }
}