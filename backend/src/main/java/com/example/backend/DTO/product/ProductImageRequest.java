package com.example.backend.DTO.product;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductImageRequest {
    private String url;
    private Boolean isMain;
}
