package com.example.backend.service;

import com.example.backend.DTO.cart.AddToCartRequest;
import com.example.backend.module.Cart;

public interface CartService {
    Cart addToCart(AddToCartRequest request);
    Cart getCartByUserId(String userId);
    Cart removeItem(String userId, String productId, String variantSku);
    void clearCart(String userId);
}
