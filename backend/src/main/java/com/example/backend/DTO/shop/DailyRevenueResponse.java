package com.example.backend.DTO.shop;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyRevenueResponse {
    private String date;
    private long revenue;
    private long orderCount;
}