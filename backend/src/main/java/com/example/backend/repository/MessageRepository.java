package com.example.backend.repository;

import com.example.backend.module.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MessageRepository extends MongoRepository<Message, String> {

    Page<Message> findByConversationIdAndDeletedFalse(String conversationId, Pageable pageable);

    long countByConversationIdAndSenderRoleAndIsReadFalse(String conversationId, String senderRole);
}