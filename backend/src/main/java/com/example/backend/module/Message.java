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
import java.util.List;

// Message.java
@Document(collection = "messages")
@CompoundIndexes({
        @CompoundIndex(name = "msg_conversation_sent_idx", def = "{'conversationId': 1, 'sentAt': -1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    private String id;
    private String conversationId;
    private String senderId;
    private String senderRole;        // "USER" | "SHOP"
    private String content;           // null nếu chỉ gửi ảnh
    private List<String> imageKeys;   // object key trong MinIO, null/empty nếu chỉ text
    private boolean isRead;
    private boolean deleted;
    private Date sentAt;
}