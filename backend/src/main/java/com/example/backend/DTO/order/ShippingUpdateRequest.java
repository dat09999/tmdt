package com.example.backend.DTO.order;

import jakarta.validation.constraints.NotBlank;

public record ShippingUpdateRequest(
        @NotBlank(message = "shippingProvider không được để trống") String shippingProvider,
        @NotBlank(message = "trackingCode không được để trống") String trackingCode,
        String note
) {
}
