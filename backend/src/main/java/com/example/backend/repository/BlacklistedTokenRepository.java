package com.example.backend.repository;

import com.example.backend.module.BlacklistedToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlacklistedTokenRepository extends MongoRepository<BlacklistedToken, String> {
    boolean existsByJti(String jti);
    boolean existsByToken(String token);
}
