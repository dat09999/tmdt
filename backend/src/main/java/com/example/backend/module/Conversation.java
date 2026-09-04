package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "conversations")
@CompoundIndexes({
        @CompoundIndex(name = "unique_user_shop_chat", def = "{'userId': 1, 'shopId': 1}", unique = true),
        @CompoundIndex(name = "chat_user_recent_idx", def = "{'userId': 1, 'lastMessageAt': -1}"),
        @CompoundIndex(name = "chat_shop_recent_idx", def = "{'shopId': 1, 'lastMessageAt': -1}")
})
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