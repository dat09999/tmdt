package com.example.backend.DTO.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddToCartRequest {

    @NotBlank(message = "userId không được để trống")
    private String userId;

    @NotBlank(message = "productId không được để trống")
    private String productId;

    @NotBlank(message = "variantSku không được để trống")
    private String variantSku;

    @NotNull(message = "quantity không được để trống")
    @Min(value = 1, message = "quantity phải >= 1")
    private Integer quantity;
}
