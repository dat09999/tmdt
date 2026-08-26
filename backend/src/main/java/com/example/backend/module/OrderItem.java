package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    private String productId;
    private String shopId;
    private String variantSku;

    private String productName;
    private String image;

    private Long unitPrice;
    private Integer quantity;
    private Long totalPrice;
}