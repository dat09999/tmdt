package com.example.backend.DTO.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductVariantRequest {

    @NotBlank(message = "sku không được để trống")
    private String sku;

    private String color;
    private String size;

    @NotNull(message = "price không được để trống")
    @Min(value = 0, message = "price phải >= 0")
    private Long price;

    @Min(value = 0, message = "discountPrice phải >= 0")
    private Long discountPrice;

    @NotNull(message = "stock không được để trống")
    @Min(value = 0, message = "stock phải >= 0")
    private Integer stock;

    private Boolean active;
}
