package com.example.backend.service;

import com.example.backend.DTO.wishlist.AddToWishlistRequest;
import com.example.backend.module.Wishlist;

public interface WishlistService {
    Wishlist addToWishlist(AddToWishlistRequest request);
    Wishlist getWishlistByUserId(String userId);
    Wishlist removeFromWishlist(String userId, String productId);
    void clearWishlist(String userId);
    boolean isWish(String userId,String productID);
}
