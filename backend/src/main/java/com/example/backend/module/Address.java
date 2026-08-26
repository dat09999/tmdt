package com.example.backend.module;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    private String fullName;
    private String phone;
    private String province;
    private String district;
    private String ward;
    private String detail;
    private Boolean isDefault;
}