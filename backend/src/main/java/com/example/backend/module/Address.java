package com.example.backend.module;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    @Builder.Default
    private String id = UUID.randomUUID().toString();
    private String fullName;
    private String phone;
    private String province;
    private String district;
    private String ward;
    private String detail;
    private Double lat;
    private Double lng;
    private Boolean isDefault;
}