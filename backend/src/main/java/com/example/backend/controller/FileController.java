package com.example.backend.controller;

import com.example.backend.service.impl.ObjectStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final ObjectStorageService objectStorageService;

    @GetMapping("/{bucket}/**")
    public ResponseEntity<byte[]> getFile(
            @PathVariable String bucket,
            HttpServletRequest request
    ) {
        String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String prefix = "/api/files/" + bucket + "/";
        if (!fullPath.contains(prefix)) {
            return ResponseEntity.badRequest().build();
        }

        String key = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        byte[] data = objectStorageService.getObjectBytes(bucket, key);
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = MediaType.IMAGE_JPEG;
        String lower = key.toLowerCase();
        if (lower.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
        } else if (lower.endsWith(".webp")) {
            mediaType = MediaType.parseMediaType("image/webp");
        } else if (lower.endsWith(".gif")) {
            mediaType = MediaType.IMAGE_GIF;
        } else if (lower.endsWith(".mp4")) {
            mediaType = MediaType.parseMediaType("video/mp4");
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .body(data);
    }
}
