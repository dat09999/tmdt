package com.example.backend.DTO.auth;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private Long userId;
    private String email;
    private String role;
}