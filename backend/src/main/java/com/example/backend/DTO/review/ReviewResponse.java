package com.example.backend.DTO.review;

import com.example.backend.module.Review;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReviewResponse {
    private String id;
    private String productId;
    private String variantSku;

    private String userId;
    private String userName;
    private String userAvatarUrl;

    private Integer rating;
    private String comment;
    private List<String> imageUrls;

    private Review.ReviewReply shopReply;
    private Integer helpfulCount;

    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .variantSku(review.getVariantSku())
                .userId(review.getUserId())
                .userName(review.getUserName())
                .userAvatarUrl(review.getUserAvatarUrl())
                .rating(review.getRating())
                .comment(review.getComment())
                .imageUrls(review.getImageUrls())
                .shopReply(review.getShopReply())
                .helpfulCount(review.getHelpfulCount())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
