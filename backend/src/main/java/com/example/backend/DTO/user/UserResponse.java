package com.example.backend.DTO.user;

import com.example.backend.module.Address;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserResponse {
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private List<Address> address;
    private Double lat;
    private Double lng;
    private boolean active;
}