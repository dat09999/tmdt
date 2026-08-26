package com.example.backend.repository;

import com.example.backend.module.Conversation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends MongoRepository<Conversation, String> {

    Optional<Conversation> findByUserIdAndShopId(String userId, String shopId);

    List<Conversation> findByUserIdOrderByLastMessageAtDesc(String userId);

    List<Conversation> findByShopIdOrderByLastMessageAtDesc(String shopId);

    // Dùng cho phân trang khi user/shop có quá nhiều đoạn chat
    org.springframework.data.domain.Page<Conversation> findByUserId(String userId, Pageable pageable);

    org.springframework.data.domain.Page<Conversation> findByShopId(String shopId, Pageable pageable);
}