package com.example.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình kết nối VNPay - lấy từ application.properties/application.yml, KHÔNG hardcode.
 *
 * application.properties cần có:
 * vnpay.tmn-code=YOUR_TMN_CODE
 * vnpay.hash-secret=YOUR_HASH_SECRET
 * vnpay.pay-url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 * vnpay.return-url=https://your-domain.com/api/payment/vnpay/return
 * vnpay.ipn-url=https://your-domain.com/api/payment/vnpay/ipn   (chỉ cần nếu bạn khai báo với VNPay)
 * vnpay.version=2.1.0
 * vnpay.command=pay
 * vnpay.order-type=other
 *
 * Sandbox: đăng ký tài khoản test tại https://sandbox.vnpayment.vn để lấy tmn-code/hash-secret.
 */
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "vnpay")
public class VNPayConfig {
    private String tmnCode;
    private String hashSecret;
    private String payUrl;
    private String returnUrl;
    private String version = "2.1.0";
    private String command = "pay";
    private String orderType = "other";
}