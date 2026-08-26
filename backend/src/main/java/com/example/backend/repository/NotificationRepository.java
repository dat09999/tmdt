package com.example.backend.repository;

import com.example.backend.module.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndReadFalse(String userId);

    @Query(value = "{ 'userId': ?0, 'read': { '$ne': true } }")
    @Update("{ '$set': { 'read': true } }")
    long markAllAsReadByUserId(String userId);
}