package com.example.backend.repository;

import com.example.backend.module.ShopCategory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopCategoryRepository extends MongoRepository<ShopCategory, String> {

    List<ShopCategory> findByShopIdOrderBySortOrderAsc(String shopId);

    List<ShopCategory> findByShopIdAndActiveTrueOrderBySortOrderAsc(String shopId);

    Optional<ShopCategory> findByIdAndShopId(String id, String shopId);
}
