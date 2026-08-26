package com.example.backend.repository;
import com.example.backend.module.ShopFollow;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ShopFollowRepository extends MongoRepository<ShopFollow,String> { boolean existsByUserIdAndShopId(String userId,String shopId); long countByShopId(String shopId); void deleteByUserIdAndShopId(String userId,String shopId);

    List<ShopFollow> findByShopId(String id);
}
