package com.example.backend.service;

import com.example.backend.DTO.refund.CreateRefundRequest;
import com.example.backend.module.RefundRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface RefundRequestService {
    RefundRequest createRefundRequest(CreateRefundRequest request);
    List<RefundRequest> getRefundsByUser(String userId);
    Page<RefundRequest> getRefundsByUser(String userId, int page, int size);

    List<RefundRequest> getRefundsByShop(String shopId);
    Page<RefundRequest> getRefundsByShop(String shopId, int page, int size);

    RefundRequest getRefundById(String refundId);
    RefundRequest processRefund(String refundId, String status, String adminNote, String resolvedBy);
}
