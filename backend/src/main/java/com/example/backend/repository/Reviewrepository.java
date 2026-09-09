package com.example.backend.repository;

import com.example.backend.module.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface Reviewrepository extends MongoRepository<Review, String> {

    Page<Review> findByProductIdAndVisibleTrue(String productId, Pageable pageable);

    Page<Review> findByShopIdAndVisibleTrue(String shopId, Pageable pageable);

    java.util.List<Review> findByShopIdAndVisibleTrue(String shopId);

    boolean existsByOrderIdAndProductIdAndUserId(String orderId, String productId, String userId);

    long countByProductIdAndVisibleTrue(String productId);

    long countByShopIdAndVisibleTrue(String shopId);
}