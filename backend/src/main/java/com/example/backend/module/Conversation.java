package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "conversations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    @Id
    private String id;
    private String userId;
    private String shopId;
    private String lastMessage;
    private String lastMessageType;   // "TEXT" | "IMAGE"
    private Date lastMessageAt;
    private int unreadCountForUser;
    private int unreadCountForShop;
    private Date createdAt;
}