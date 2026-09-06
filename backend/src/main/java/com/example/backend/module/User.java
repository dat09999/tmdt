package com.example.backend.module;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String fullName;

    @Indexed(sparse = true)
    private String phone;
    private String url;
    private String role;      // USER, ADMIN
    private String provider;  // LOCAL, GOOGLE
    private Boolean active;
    private String providerId;
    private List<Address> addresses;
    private Double lat;
    private Double lng;

    @Builder.Default
    private Integer tokenVersion = 1;

    public Integer getTokenVersion() {
        return tokenVersion != null ? tokenVersion : 1;
    }
}