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
public class CartItem {

    private String productId;
    private String shopId;
    private String variantSku;

    private String productName;
    private String image;

    private Long price;
    private Integer quantity;
}