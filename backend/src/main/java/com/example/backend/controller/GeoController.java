package com.example.backend.controller;


import com.example.backend.DTO.place.PlaceDetail;
import com.example.backend.DTO.place.PlaceSuggestion;
import com.example.backend.service.GeoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
public class GeoController {

    private final GeoService geoService;

    @GetMapping("/suggest")
    public ResponseEntity<List<PlaceSuggestion>> suggest(@RequestParam String input) {
        return ResponseEntity.ok(geoService.suggest(input));
    }

    @GetMapping("/resolve")
    public ResponseEntity<PlaceDetail> resolve(@RequestParam String placeId) {
        return ResponseEntity.ok(geoService.resolve(placeId));
    }
}