package com.example.backend.DTO.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingEstimateResponse {
    private double distanceKm;
    private long shippingFee;
    private String feeLabel;
    private String distanceLabel;
    private String note;
}