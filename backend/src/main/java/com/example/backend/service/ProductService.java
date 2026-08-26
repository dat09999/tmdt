package com.example.backend.service;

import com.example.backend.DTO.product.CreateProductRequest;
import com.example.backend.DTO.product.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(CreateProductRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(String productId);

    ProductResponse getProductBySlug(String slug);

    List<ProductResponse> getProductsByShop(String shopId);

    List<ProductResponse> getProductsByCategory(String categoryId);

    List<ProductResponse> searchByName(String keyword);

    List<ProductResponse> searchByTag(String tag);

    ProductResponse updateProduct(String productId, CreateProductRequest request);

    void deleteProduct(String productId);

    ProductResponse incrementViewCount(String productId);
}
