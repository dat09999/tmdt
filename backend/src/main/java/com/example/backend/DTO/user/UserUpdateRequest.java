package com.example.backend.DTO.user;

import com.example.backend.module.Address;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserUpdateRequest {
    private String fullName;
    private String phone;
    private String url;
}