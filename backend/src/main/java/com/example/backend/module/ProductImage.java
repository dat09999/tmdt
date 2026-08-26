package com.example.backend.module;

import com.example.backend.Enum.IMAGE_VIDEO;
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
public class ProductImage {

    private String url;
    private Boolean isMain;
    private IMAGE_VIDEO imageVideo;
}