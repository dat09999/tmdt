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
public class PlaceSuggestion {
    private String placeId;
    private String text;          // địa chỉ đầy đủ
    private String mainText;      // dòng chính
    private String secondaryText; // dòng phụ
}