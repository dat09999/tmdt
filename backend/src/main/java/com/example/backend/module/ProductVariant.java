package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    private String sku;
    private String color;
    private String size;
    private Long price;
    private Long discountPrice;
    private Integer stock;
    private Boolean active;
}