package com.example.backend.service;

import com.example.backend.DTO.refund.CreateRefundRequest;
import com.example.backend.module.RefundRequest;

import java.util.List;

public interface RefundRequestService {
    RefundRequest createRefundRequest(CreateRefundRequest request);
    List<RefundRequest> getRefundsByUser(String userId);
    List<RefundRequest> getRefundsByShop(String shopId);
    RefundRequest getRefundById(String refundId);
    RefundRequest processRefund(String refundId, String status, String adminNote, String resolvedBy);
}
