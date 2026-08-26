package com.example.backend.DTO.shop;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ShopStatisticsResponse {
    private String shopId;
    private long productCount;
    private long orderCount;
    private long totalSales;
    private double averageRating;
    private long revenue;
}
