package com.example.backend.controller.admin;

import com.example.backend.DTO.review.ReviewResponse;
import com.example.backend.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminReviewControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReviewService reviewService;

    @InjectMocks
    private AdminReviewController adminReviewController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminReviewController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetAllReviews_WithRatingFilter() throws Exception {
        ReviewResponse r = ReviewResponse.builder()
                .id("rev-1")
                .productId("prod-1")
                .rating(1)
                .comment("Hàng không đúng mô tả")
                .userName("Tran B")
                .build();

        when(reviewService.getAllReviews(eq(1), any(), any(), eq("prod-1"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(r), org.springframework.data.domain.PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/admin/reviews")
                        .param("rating", "1")
                        .param("productId", "prod-1")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("rev-1"))
                .andExpect(jsonPath("$.content[0].rating").value(1))
                .andExpect(jsonPath("$.content[0].comment").value("Hàng không đúng mô tả"));
    }
}
