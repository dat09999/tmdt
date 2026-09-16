package com.example.backend.domain.refund;

public class RefundAlreadyProcessedException extends RuntimeException {
    public RefundAlreadyProcessedException(String refundId) {
        super("Yêu cầu hoàn trả này đã được xử lý trước đó, vui lòng tải lại trang");
    }
}