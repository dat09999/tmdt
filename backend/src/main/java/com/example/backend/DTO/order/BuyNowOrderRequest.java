package com.example.backend.DTO.order;

import com.example.backend.module.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request cho luồng "Mua ngay" - tạo order trực tiếp từ 1 sản phẩm/variant,
 * không cần đi qua giỏ hàng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuyNowOrderRequest {
    private String buyerId;
    private String productId;
    private String variantSku;
    private int quantity;
    private Address shippingAddress;
    private String note;
    private String couponCode;
    private String paymentMethod;
}
