package com.example.backend.domain.refund;

import com.example.backend.module.RefundRequest;

import java.util.Optional;

public interface RefundRequestGateway {

    RefundRequest save(RefundRequest refund);

    // Chuyển refund sang trạng thái mới, chỉ khi refund hiện đang PENDING
    Optional<RefundRequest> markProcessed(String refundId, String newStatus, String adminNote, String resolvedBy);
}