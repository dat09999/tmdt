package com.example.backend.service;

import com.example.backend.DTO.shop.CreateShopCategoryRequest;
import com.example.backend.DTO.shop.ShopCategoryResponse;

import java.util.List;

public interface ShopCategoryService {

    List<ShopCategoryResponse> getShopCategories(String shopId, boolean activeOnly);

    ShopCategoryResponse getShopCategoryById(String shopId, String categoryId);

    ShopCategoryResponse createShopCategory(String shopId, CreateShopCategoryRequest request);

    ShopCategoryResponse updateShopCategory(String shopId, String categoryId, CreateShopCategoryRequest request);

    void deleteShopCategory(String shopId, String categoryId);
}
