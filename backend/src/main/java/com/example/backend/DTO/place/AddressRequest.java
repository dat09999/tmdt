package com.example.backend.DTO.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddressRequest {
    private String fullName;
    private String phone;
    private String province;
    private String district;
    private String ward;
    private String detail;   // = formattedAddress lấy từ Google
    private Double lat;
    private Double lng;
    private Boolean isDefault;
}