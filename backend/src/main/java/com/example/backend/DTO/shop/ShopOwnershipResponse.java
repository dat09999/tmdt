package com.example.backend.DTO.shop;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ShopOwnershipResponse {
    private String shopId;
    private String userId;
    private boolean owner;
    private String message;
}
