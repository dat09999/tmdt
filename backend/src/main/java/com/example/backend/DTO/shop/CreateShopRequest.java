package com.example.backend.DTO.shop;

import com.example.backend.module.Address;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateShopRequest {

    @NotBlank(message = "ownerId không được để trống")
    private String ownerId;

    @NotBlank(message = "shopName không được để trống")
    private String shopName;

    private String description;
    private String logo;
    private String coverImage;
    private String phone;
    private String email;
    private Address address;
}
