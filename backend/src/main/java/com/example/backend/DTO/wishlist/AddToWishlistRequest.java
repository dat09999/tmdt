package com.example.backend.DTO.wishlist;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddToWishlistRequest {

    @NotBlank(message = "userId không được để trống")
    private String userId;

    @NotBlank(message = "productId không được để trống")
    private String productId;
}
