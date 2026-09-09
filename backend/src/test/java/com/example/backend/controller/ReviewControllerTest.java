package com.example.backend.controller;

import com.example.backend.DTO.review.RatingSummary;
import com.example.backend.DTO.review.ReviewResponse;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.Reviewrepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class ReviewControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReviewService reviewService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Reviewrepository reviewRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private ReviewController reviewController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reviewController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetReviewsByShop() throws Exception {
        ReviewResponse rev = ReviewResponse.builder()
                .id("rev-10")
                .shopId("shop-1")
                .productId("prod-1")
                .rating(5)
                .comment("Shop phuc vu rat tot")
                .userName("Nguyen Van A")
                .build();

        when(reviewService.getReviewsByShop(eq("shop-1"), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(rev), org.springframework.data.domain.PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/reviews/shop/shop-1")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("rev-10"))
                .andExpect(jsonPath("$.content[0].shopId").value("shop-1"))
                .andExpect(jsonPath("$.content[0].rating").value(5))
                .andExpect(jsonPath("$.content[0].comment").value("Shop phuc vu rat tot"));
    }

    @Test
    void testGetShopRatingSummary() throws Exception {
        RatingSummary summary = RatingSummary.builder()
                .avgRating(4.8)
                .totalReviews(25L)
                .starBreakdown(Map.of(5, 20L, 4, 5L))
                .build();

        when(reviewService.getShopRatingSummary("shop-1")).thenReturn(summary);

        mockMvc.perform(get("/reviews/shop/shop-1/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avgRating").value(4.8))
                .andExpect(jsonPath("$.totalReviews").value(25));
    }

    @Test
    void testRecalculateShopRating() throws Exception {
        RatingSummary summary = RatingSummary.builder()
                .avgRating(4.9)
                .totalReviews(30L)
                .build();

        when(reviewService.getShopRatingSummary("shop-1")).thenReturn(summary);

        mockMvc.perform(post("/reviews/shop/shop-1/recalculate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avgRating").value(4.9))
                .andExpect(jsonPath("$.totalReviews").value(30));

        verify(reviewService).recalculateShopRating("shop-1");
    }
}
