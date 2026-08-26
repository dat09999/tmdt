package com.example.backend.DTO.shop;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ShopSummaryResponse {
    private String id;
    private String shopName;
    private String logo;
    private String status;
    private Double rating;
    private Integer totalSales;
}
