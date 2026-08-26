package com.example.backend.repository;

import com.example.backend.module.Product;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByShopId(String shopId);
    List<Product> findByCategoryId(String categoryId);
    List<Product> findByStatus(String status);
    List<Product> findByNameContainingIgnoreCase(String keyword);
    List<Product> findByTagsContaining(String tag);
    List<Product> findByShopIdAndStatus(String shopId, String status);
    List<Product> findByCategoryIdAndStatus(String categoryId, String status);
    List<Product> findByBrandIgnoreCase(String brand);
    Optional<Product> findBySlug(String slug);
}
