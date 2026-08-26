package com.example.backend.repository;

import com.example.backend.module.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface Reviewrepository extends MongoRepository<Review, String> {

    Page<Review> findByProductIdAndVisibleTrue(String productId, Pageable pageable);

    boolean existsByOrderIdAndProductIdAndUserId(String orderId, String productId, String userId);

    long countByProductIdAndVisibleTrue(String productId);
}