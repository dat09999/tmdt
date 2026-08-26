package com.example.backend.DTO.product;

import com.example.backend.module.ProductVariant;
import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private String id;

    private String shopId;
    private String categoryId;

    private String name;
    private String slug;
    private String description;
    private String brand;

    private Long basePrice;
    private String status;

    private List<ProductImageResponse> images;
    private List<ProductVariant> variants;
    private List<String> tags;

    private Integer soldCount;
    private Integer viewCount;
    private Double rating;
    private Integer totalReviews;

    private Date createdAt;
    private Date updatedAt;
}
