package com.example.backend.repository;

import com.example.backend.module.RefundRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RefundRequestRepository extends MongoRepository<RefundRequest, String> {
    List<RefundRequest> findByUserId(String userId);
    Page<RefundRequest> findByUserId(String userId, Pageable pageable);

    List<RefundRequest> findByOrderId(String orderId);

    List<RefundRequest> findByShopId(String shopId);
    Page<RefundRequest> findByShopId(String shopId, Pageable pageable);

    List<RefundRequest> findByStatus(String status);
    Page<RefundRequest> findByStatus(String status, Pageable pageable);
}
