package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    private String method;              // COD, VNPAY, MOMO, ZALOPAY
    private String status;              // PENDING, PAID, FAILED, REFUNDED
    private Long amount;                // số tiền thanh toán
    private String currency;            // VND, USD

    private String transactionCode;     // mã giao dịch từ cổng thanh toán
    private String providerOrderId;     // ID đơn hàng bên cổng thanh toán (VNPay, MoMo...)
    private String failureReason;       // lý do thất bại nếu status=FAILED

    private Date paidAt;
    private Date refundedAt;
}
