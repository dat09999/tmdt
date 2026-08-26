package com.example.backend.repository;

import com.example.backend.module.Order;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
    List<Order> findByShopIdOrderByCreatedAtDesc(String shopId);
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByOrderStatus(String orderStatus);
    List<Order> findByBuyerIdAndOrderStatus(String buyerId, String orderStatus);

 List<Order> findByOrderStatusAndCreatedAtBefore(String orderStatus, Date createdAt);

}
