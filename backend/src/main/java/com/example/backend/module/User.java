package com.example.backend.module;

import lombok.*;
import org.springframework.data.annotation.Id;
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

    private String email;
    private String password;
    private String fullName;
    private String phone;

    private String role;      // USER, ADMIN
    private String provider;  // LOCAL, GOOGLE
    private Boolean active;
    private String providerId;
    private List<Address> addresses;
}