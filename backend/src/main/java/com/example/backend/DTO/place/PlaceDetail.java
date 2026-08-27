package com.example.backend.DTO.place;

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
public class PlaceDetail {
    private String placeId;
    private String formattedAddress;
    private Double lat;
    private Double lng; // đổi tên từ "lon" bên GoGoDuk cho khớp field Address.lng của mình
}