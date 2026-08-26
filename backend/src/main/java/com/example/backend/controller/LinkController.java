package com.example.backend.controller;

import com.example.backend.Enum.IMAGE_VIDEO;
import com.example.backend.Enum.Type;
import com.example.backend.service.LinkService;
import com.example.backend.service.impl.ObjectStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
@Slf4j
@RestController
@RequestMapping("/api/links")
@RequiredArgsConstructor
public class LinkController {

    private final LinkService linkService;


    // Upload ảnh/video cho movie/user/banner...
    @PostMapping(value = "/{type}/{targetId}/{imageVideo}/{main}",consumes = "multipart/form-data")
    public ResponseEntity<?> addLink(
            @PathVariable Type type,
            @PathVariable String targetId,
            @PathVariable IMAGE_VIDEO imageVideo,
            @PathVariable Boolean main,
            @RequestPart("file") MultipartFile file
    ) {
        log.info("hello");
        linkService.addLink(type, targetId, imageVideo, file,main);

        return ResponseEntity.ok(
                Map.of("message", "Upload link thành công")
        );
    }

    // Lấy danh sách link ảnh/video
    @GetMapping("/{type}/{targetId}/{imageVideo}")
    public ResponseEntity<List<String>> getLinks(
            @PathVariable Type type,
            @PathVariable String targetId,
            @PathVariable IMAGE_VIDEO imageVideo

    ) {
        List<String> links = linkService.getLinks(type, targetId, imageVideo);

        return ResponseEntity.ok(links);
    }

    // Xóa link theo type + targetId + imageVideo
    @DeleteMapping("/{type}/{targetId}/{imageVideo}")
    public ResponseEntity<?> deleteLink(
            @PathVariable Type type,
            @PathVariable String targetId,
            @PathVariable IMAGE_VIDEO imageVideo,
            @RequestParam String url
    ) {
        log.info("Bắt đầu xóa link. type={}, targetId={}, imageVideo={}, url={}",
                type, targetId, imageVideo, url);
        linkService.deleteLink(type, targetId, imageVideo,url);

        return ResponseEntity.ok(
                Map.of("message", "Xóa link thành công")
        );
    }
}