package com.example.backend.DTO.shop;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopCategoryResponse {

    private String id;
    private String shopId;
    private String name;
    private String description;
    private Integer sortOrder;
    private Boolean active;
    private Long productCount;
    private Date createdAt;
    private Date updatedAt;
}
