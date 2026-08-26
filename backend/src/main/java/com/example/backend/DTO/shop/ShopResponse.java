package com.example.backend.DTO.shop;

import com.example.backend.DTO.common.AddressResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopResponse {

    private String id;

    private String ownerId;
    private String shopName;
    private String description;
    private String logo;
    private String coverImage;
    private String status;

    private String phone;
    private String email;
    private AddressResponse address;

    private Double rating;
    private Integer totalReviews;
    private Integer totalSales;

    private Date createdAt;
    private Date updatedAt;
}
