package com.example.backend.controller;

import com.example.backend.DTO.cart.AddToCartRequest;
import com.example.backend.Exception.ForbiddenException;
import com.example.backend.module.Cart;
import com.example.backend.sercurity.SecurityUtils;
import com.example.backend.service.CartService;
import com.example.backend.service.impl.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping
    public ResponseEntity<Cart> addToCart(@Valid @RequestBody AddToCartRequest request) {
        validateCartOwner(request.getUserId());
        return ResponseEntity.ok(cartService.addToCart(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Cart> getCart(@PathVariable String userId) {
        validateCartOwner(userId);
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @DeleteMapping("/{userId}/item")
    public ResponseEntity<Cart> removeItem(@PathVariable String userId,
                                           @RequestParam String productId,
                                           @RequestParam String variantSku) {
        validateCartOwner(userId);
        return ResponseEntity.ok(cartService.removeItem(userId, productId, variantSku));
    }

    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<Void> clearCart(@PathVariable String userId) {
        validateCartOwner(userId);
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    private void validateCartOwner(String targetUserId) {
        if (targetUserId == null || targetUserId.isBlank()) return;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return;
        }
        if (SecurityUtils.isAdmin()) {
            return;
        }
        String currentUserId = null;
        if (auth.getPrincipal() instanceof UserPrincipal principal) {
            currentUserId = principal.getId();
        } else if (auth.getName() != null) {
            currentUserId = auth.getName();
        }
        if (currentUserId != null && !currentUserId.equals(targetUserId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên giỏ hàng của người khác");
        }
    }
}
