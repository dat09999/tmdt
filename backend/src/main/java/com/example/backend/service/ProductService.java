package com.example.backend.service;

import com.example.backend.DTO.product.CreateProductRequest;
import com.example.backend.DTO.product.ProductResponse;

import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(CreateProductRequest request);

    List<ProductResponse> getAllProducts();
    Page<ProductResponse> getAllProducts(int page, int size);

    ProductResponse getProductById(String productId);

    ProductResponse getProductBySlug(String slug);

    List<ProductResponse> getProductsByShop(String shopId);
    Page<ProductResponse> getProductsByShop(String shopId, int page, int size);

    List<ProductResponse> getProductsByCategory(String categoryId);
    Page<ProductResponse> getProductsByCategory(String categoryId, int page, int size);

    List<ProductResponse> searchByName(String keyword);
    Page<ProductResponse> searchByName(String keyword, int page, int size);

    List<ProductResponse> searchByTag(String tag);
    Page<ProductResponse> searchByTag(String tag, int page, int size);

    ProductResponse updateProduct(String productId, CreateProductRequest request);

    void deleteProduct(String productId);

    ProductResponse incrementViewCount(String productId);
}
