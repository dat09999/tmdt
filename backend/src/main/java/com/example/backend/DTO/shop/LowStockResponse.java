package com.example.backend.DTO.shop;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockResponse {
    private String productId;
    private String productName;
    private String sku;
    private String color;
    private String size;
    private int stock;
}