package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    private String id;

    private String shopId;
    private String categoryId;

    private String name;
    private String slug;            // URL-friendly name, dùng cho SEO
    private String description;
    private String brand;

    private Long basePrice;
    private String status;          // ACTIVE, INACTIVE, OUT_OF_STOCK

    private List<ProductImage> images;

    private List<ProductVariant> variants;
    private List<String> tags;      // tag tìm kiếm

    // Thống kê
    private Integer soldCount;      // số lượng đã bán
    private Integer viewCount;      // lượt xem
    private Double rating;          // điểm đánh giá trung bình
    private Integer totalReviews;

    private Date createdAt;
    private Date updatedAt;
}
