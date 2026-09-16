package com.example.backend.DTO.shop;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateShopCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    private String description;

    private String parentCategoryId;

    private String parentCategoryName;

    private Integer sortOrder;

    private Boolean active;
}
