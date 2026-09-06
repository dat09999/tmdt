package com.example.backend.repository;

import com.example.backend.module.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByShopId(String shopId);
    Page<Product> findByShopId(String shopId, Pageable pageable);

    List<Product> findByCategoryId(String categoryId);
    Page<Product> findByCategoryId(String categoryId, Pageable pageable);

    List<Product> findByStatus(String status);
    Page<Product> findByStatus(String status, Pageable pageable);

    List<Product> findByNameContainingIgnoreCase(String keyword);
    Page<Product> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    List<Product> findByTagsContaining(String tag);
    Page<Product> findByTagsContaining(String tag, Pageable pageable);

    List<Product> findByShopIdAndStatus(String shopId, String status);
    Page<Product> findByShopIdAndStatus(String shopId, String status, Pageable pageable);

    List<Product> findByCategoryIdAndStatus(String categoryId, String status);
    Page<Product> findByCategoryIdAndStatus(String categoryId, String status, Pageable pageable);

    List<Product> findByBrandIgnoreCase(String brand);
    Optional<Product> findBySlug(String slug);
    long countByShopId(String shopId);
}
