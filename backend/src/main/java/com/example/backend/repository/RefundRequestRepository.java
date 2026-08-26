package com.example.backend.repository;

import com.example.backend.module.RefundRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RefundRequestRepository extends MongoRepository<RefundRequest, String> {
    List<RefundRequest> findByUserId(String userId);
    List<RefundRequest> findByOrderId(String orderId);
    List<RefundRequest> findByShopId(String shopId);
    List<RefundRequest> findByStatus(String status);
}
