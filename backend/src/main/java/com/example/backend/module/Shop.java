package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    private String id;

    // Mỗi user chỉ được sở hữu một shop. MongoDB sẽ chặn dữ liệu trùng.
    @Indexed(name = "unique_shop_owner", unique = true)
    private String ownerId;
    private String shopName;
    private String description;
    private String logo;
    private String coverImage;      // ảnh bìa shop
    private String status;          // ACTIVE, INACTIVE, BLOCKED

    // Thông tin liên hệ
    private String phone;
    private String email;
    private Address address;        // địa chỉ shop

    // Thống kê
    private Double rating;          // điểm đánh giá trung bình shop
    private Integer totalReviews;
    private Integer totalSales;     // tổng số đơn đã bán

    private Date createdAt;
    private Date updatedAt;
}
