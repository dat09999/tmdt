package com.example.backend.DTO.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCategoryRequest {

    @NotBlank(message = "name không được để trống")
    private String name;

    private String description;
    private String parentId;
    private String image;
    private String slug;

    private Integer sortOrder;
}
