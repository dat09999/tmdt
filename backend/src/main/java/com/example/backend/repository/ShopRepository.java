package com.example.backend.repository;

import com.example.backend.module.Shop;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ShopRepository extends MongoRepository<Shop, String> {
    Optional<Shop> findByOwnerId(String ownerId);
    List<Shop> findByStatus(String status);
    List<Shop> findByShopNameContainingIgnoreCase(String keyword);
    Page<Shop> findByShopNameContainingIgnoreCase(String keyword, Pageable pageable);
    Page<Shop> findByStatus(String status, Pageable pageable);
}
