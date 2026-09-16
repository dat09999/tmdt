package com.example.backend.domain.refund;

public class RefundOrderStateConflictException extends RuntimeException {
    public RefundOrderStateConflictException(String orderId, String refundId) {
        super("Duyệt refund " + refundId + " thành công nhưng order " + orderId +
                " không còn ở trạng thái phù hợp để chuyển REFUNDED - cần kiểm tra thủ công");
    }
}