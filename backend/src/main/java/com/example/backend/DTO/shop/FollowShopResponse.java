package com.example.backend.DTO.shop;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FollowShopResponse {
    private String shopId;
    private long followerCount;
    private boolean following;
    private String message;
}
