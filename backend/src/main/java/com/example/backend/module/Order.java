package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "orders")
@CompoundIndexes({
        @CompoundIndex(name = "order_buyer_created_idx", def = "{'buyerId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "order_shop_created_idx", def = "{'shopId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "order_status_created_idx", def = "{'orderStatus': 1, 'createdAt': 1}"),
        @CompoundIndex(name = "order_verified_purchase_idx", def = "{'buyerId': 1, 'orderStatus': 1, 'items.productId': 1}")
})
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

    @Indexed(unique = true)
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
