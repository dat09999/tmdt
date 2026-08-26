package com.example.backend.DTO.product;

import com.example.backend.Enum.IMAGE_VIDEO;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImageResponse {
    private String key;
    private String url;
    private IMAGE_VIDEO imageVideo;
    private Boolean isMain;
}