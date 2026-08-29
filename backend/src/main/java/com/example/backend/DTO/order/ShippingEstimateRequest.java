package com.example.backend.DTO.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShippingEstimateRequest {

    @NotBlank(message = "shopId khong duoc de trong")
    private String shopId;

    @NotNull(message = "Toa do nguoi mua khong duoc de trong")
    private CoordinateDto buyerLocation;

    @Getter
    @Setter
    public static class CoordinateDto {
        @NotNull(message = "lat khong duoc de trong")
        private Double lat;

        @NotNull(message = "lng khong duoc de trong")
        private Double lng;
    }
}