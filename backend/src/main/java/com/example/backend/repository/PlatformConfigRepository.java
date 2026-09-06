package com.example.backend.repository;

import com.example.backend.module.PlatformConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlatformConfigRepository extends MongoRepository<PlatformConfig, String> {
}
