package com.example.backend.DTO.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingSummary {
    private Double avgRating;
    private Long totalReviews;
    private Map<Integer, Long> starBreakdown; // {5: 120, 4: 30, 3: 5, 2: 1, 1: 0}
}
