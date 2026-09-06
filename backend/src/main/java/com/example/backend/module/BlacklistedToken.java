package com.example.backend.module;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "blacklisted_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlacklistedToken {

    @Id
    private String id;

    @Indexed(sparse = true)
    private String jti;

    @Indexed(sparse = true)
    private String token;

    private String userId;

    /**
     * MongoDB TTL Index: documents will be automatically purged by MongoDB
     * as soon as current time >= expiresAt.
     */
    @Indexed(expireAfterSeconds = 0)
    private Date expiresAt;
}
