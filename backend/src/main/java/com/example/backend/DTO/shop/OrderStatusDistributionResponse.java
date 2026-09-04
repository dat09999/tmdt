package com.example.backend.DTO.shop;

import lombok.*;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusDistributionResponse {
    private Map<String, Long> statusCounts;
    private long totalOrders;
}