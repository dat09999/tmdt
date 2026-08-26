package com.example.backend.DTO.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressResponse {

    private String fullName;
    private String phone;
    private String detail;
    private String ward;
    private String district;
    private String province;
}
