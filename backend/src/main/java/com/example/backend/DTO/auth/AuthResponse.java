package com.example.backend.DTO.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String userId;
    private String email;
    private String role;
    private String fullName;
    private String phone;
    private String avatar;
    private String url;
    private String provider;
}