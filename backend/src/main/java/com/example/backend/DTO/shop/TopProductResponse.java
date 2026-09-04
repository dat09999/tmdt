package com.example.backend.DTO.shop;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse {
    private String productId;
    private String productName;
    private String imageUrl;
    private long basePrice;
    private int soldCount;
    private long revenue;
}