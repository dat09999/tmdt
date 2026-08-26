package com.example.backend.DTO.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateReviewRequest {

    @NotBlank(message = "userId không được để trống")
    private String userId;

    @NotBlank(message = "productId không được để trống")
    private String productId;

    @NotBlank(message = "orderId không được để trống")
    private String orderId;             // bắt buộc để verify đã mua hàng

    @NotNull(message = "rating không được để trống")
    @Min(value = 1, message = "rating phải >= 1")
    @Max(value = 5, message = "rating phải <= 5")
    private Integer rating;

    private String comment;
    private List<String> images;        // ảnh đính kèm review
}
