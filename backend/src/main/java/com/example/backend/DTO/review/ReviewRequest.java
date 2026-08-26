
package com.example.backend.DTO.review;

import lombok.Data;

import java.util.List;

@Data
public class ReviewRequest {
    private String productId;
    private String orderId;
    private String variantSku;    // optional

    private Integer rating;       // 1-5, bắt buộc
    private String comment;       // optional nếu chỉ chấm sao

    private List<String> imageUrls;   // optional
}
