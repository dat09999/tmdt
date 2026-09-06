package com.example.backend.service;

import com.example.backend.module.BlacklistedToken;
import com.example.backend.repository.BlacklistedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Date;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;

    public void blacklistToken(String token, String jti, String userId, Date expiresAt) {
        try {
            if (expiresAt == null || expiresAt.before(new Date())) {
                return; // Token is already expired, no need to blacklist
            }
            BlacklistedToken blacklistedToken = BlacklistedToken.builder()
                    .token(token)
                    .jti(jti)
                    .userId(userId)
                    .expiresAt(expiresAt)
                    .build();
            blacklistedTokenRepository.save(blacklistedToken);
            log.info("Blacklisted token with jti: {}, userId: {}, expiresAt: {}", jti, userId, expiresAt);
        } catch (Exception e) {
            log.error("Failed to blacklist token: {}", e.getMessage());
        }
    }

    public boolean isBlacklisted(String token, String jti) {
        try {
            if (jti != null && !jti.isBlank() && blacklistedTokenRepository.existsByJti(jti)) {
                return true;
            }
            if (token != null && !token.isBlank() && blacklistedTokenRepository.existsByToken(token)) {
                return true;
            }
        } catch (Exception e) {
            log.error("Error checking token blacklist: {}", e.getMessage());
        }
        return false;
    }
}
