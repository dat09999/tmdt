package com.example.backend.DTO.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReconciliationResponse {
    private String orderId;
    private String orderCode;
    private String buyerId;
    private String shopId;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private Long amount;
    private String transactionCode;
    private Date paidAt;
    private Date createdAt;
    private boolean isAnomaly;
    private String anomalyNote;
}
