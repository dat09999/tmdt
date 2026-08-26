package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    private String id;

    private String buyerId;
    private String shopId;          // mỗi order thuộc 1 shop
    private String orderCode;

    private Address shippingAddress;
    private List<OrderItem> items;

    private Long subtotal;
    private Long shippingFee;
    private Long discountAmount;
    private Long totalAmount;

    private String shippingProvider;
    private String trackingCode;
    private Date shippedAt;
    private Date deliveredAt;

    private String orderStatus;     // PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELED, REFUNDED
    private String couponCode;
    private String note;            // ghi chú của người mua

    private String cancelReason;    // lý do hủy đơn
    private String canceledBy;      // BUYER, SELLER, SYSTEM

    private Payment payment;
    private List<OrderStatusLog> statusLogs; // lịch sử thay đổi trạng thái

    private Date createdAt;
    private Date updatedAt;
}
