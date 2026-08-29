package com.example.backend.repository;

import com.example.backend.module.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
    Page<Order> findByBuyerId(String buyerId, Pageable pageable);

    List<Order> findByShopIdOrderByCreatedAtDesc(String shopId);
    Page<Order> findByShopId(String shopId, Pageable pageable);
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByOrderStatus(String orderStatus);
    List<Order> findByBuyerIdAndOrderStatus(String buyerId, String orderStatus);
    @Query("{ 'buyerId': ?0, 'orderStatus': 'DELIVERED', 'items.productId': ?1 }")
    boolean existsDeliveredOrderForProduct(String buyerId, String productId);


    List<Order> findByOrderStatusAndCreatedAtBefore(String orderStatus, Date createdAt);

}
