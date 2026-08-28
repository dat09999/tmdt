package com.example.backend.controller;

import com.example.backend.DTO.wishlist.AddToWishlistRequest;
import com.example.backend.module.Wishlist;
import com.example.backend.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping
    public ResponseEntity<Wishlist> addToWishlist(@Valid @RequestBody AddToWishlistRequest request) {
        return ResponseEntity.ok(wishlistService.addToWishlist(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Wishlist> getWishlist(@PathVariable String userId) {
        return ResponseEntity.ok(wishlistService.getWishlistByUserId(userId));
    }
    @GetMapping("/{userId}/{productId}")
    public ResponseEntity<Boolean> isWish(@PathVariable String userId,@PathVariable String productId) {
        return ResponseEntity.ok(wishlistService.isWish(userId,productId));
    }

    @DeleteMapping("/{userId}/item")
    public ResponseEntity<Wishlist> removeItem(@PathVariable String userId,
                                               @RequestParam String productId) {
        return ResponseEntity.ok(wishlistService.removeFromWishlist(userId, productId));
    }

    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<Void> clearWishlist(@PathVariable String userId) {
        wishlistService.clearWishlist(userId);
        return ResponseEntity.noContent().build();
    }
}
