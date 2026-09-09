package com.example.backend.controller;

import com.example.backend.DTO.shop.CreateShopCategoryRequest;
import com.example.backend.DTO.shop.ShopCategoryResponse;
import com.example.backend.service.ShopCategoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class ShopCategoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ShopCategoryService shopCategoryService;

    @InjectMocks
    private ShopCategoryController shopCategoryController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(shopCategoryController).build();
    }

    @Test
    void testGetShopCategories() throws Exception {
        ShopCategoryResponse cat = ShopCategoryResponse.builder()
                .id("cat1")
                .shopId("shop1")
                .name("Hàng Mới Về")
                .sortOrder(1)
                .active(true)
                .productCount(10L)
                .build();

        when(shopCategoryService.getShopCategories("shop1", false)).thenReturn(List.of(cat));

        mockMvc.perform(get("/shops/shop1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("cat1"))
                .andExpect(jsonPath("$[0].name").value("Hàng Mới Về"))
                .andExpect(jsonPath("$[0].productCount").value(10));
    }

    @Test
    void testCreateShopCategory() throws Exception {
        CreateShopCategoryRequest request = CreateShopCategoryRequest.builder()
                .name("Áo Thun Hè")
                .description("Bộ sưu tập hè 2026")
                .sortOrder(2)
                .active(true)
                .build();

        ShopCategoryResponse response = ShopCategoryResponse.builder()
                .id("cat2")
                .shopId("shop1")
                .name("Áo Thun Hè")
                .description("Bộ sưu tập hè 2026")
                .sortOrder(2)
                .active(true)
                .productCount(0L)
                .build();

        when(shopCategoryService.createShopCategory(eq("shop1"), any())).thenReturn(response);

        mockMvc.perform(post("/shops/shop1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("cat2"))
                .andExpect(jsonPath("$.name").value("Áo Thun Hè"));
    }

    @Test
    void testUpdateShopCategory() throws Exception {
        CreateShopCategoryRequest request = CreateShopCategoryRequest.builder()
                .name("Áo Thun Hè Đẹp")
                .sortOrder(1)
                .active(true)
                .build();

        ShopCategoryResponse response = ShopCategoryResponse.builder()
                .id("cat2")
                .shopId("shop1")
                .name("Áo Thun Hè Đẹp")
                .sortOrder(1)
                .active(true)
                .productCount(5L)
                .build();

        when(shopCategoryService.updateShopCategory(eq("shop1"), eq("cat2"), any())).thenReturn(response);

        mockMvc.perform(put("/shops/shop1/categories/cat2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("cat2"))
                .andExpect(jsonPath("$.name").value("Áo Thun Hè Đẹp"));
    }

    @Test
    void testDeleteShopCategory() throws Exception {
        doNothing().when(shopCategoryService).deleteShopCategory("shop1", "cat2");

        mockMvc.perform(delete("/shops/shop1/categories/cat2"))
                .andExpect(status().isNoContent());
    }
}
