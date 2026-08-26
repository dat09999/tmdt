package com.example.backend.service;


import com.example.backend.DTO.review.RatingSummary;
import com.example.backend.DTO.review.ReviewRequest;
import com.example.backend.DTO.review.ReviewResponse;
import org.springframework.data.domain.Page;

public interface ReviewService {

    ReviewResponse createReview(String userId, ReviewRequest request);

    Page<ReviewResponse> getReviewsByProduct(String productId, int page, int size);

    RatingSummary getRatingSummary(String productId);

    ReviewResponse replyToReview(String reviewId, String replyContent);

    void markHelpful(String reviewId);

    void hideReview(String reviewId);
}
