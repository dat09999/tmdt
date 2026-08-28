package com.example.backend.DTO.product;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateProductRequest {

    @NotBlank(message = "shopId không được để trống")
    private String shopId;

    @NotBlank(message = "categoryId không được để trống")
    private String categoryId;

    @NotBlank(message = "name không được để trống")
    private String name;

    private String slug;
    private String description;
    private String brand;
    private List<String> tags;

    @NotNull(message = "basePrice không được để trống")
    @Min(value = 0, message = "basePrice phải >= 0")
    private Long basePrice;

    private List<ProductImageRequest> images;
    @NotEmpty(message = "Sản phẩm phải có ít nhất một phân loại/biến thể")
    private List<ProductVariantRequest> variants;
}
