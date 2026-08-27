package com.example.backend.service;

import com.example.backend.DTO.place.PlaceSuggestion;
import com.example.backend.DTO.place.PlaceDetail;

import com.example.backend.Exception.BadRequestException;



import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class GeoService {

    private final RestClient restClient;

    @Value("${gogoduk.api-key}")
    private String apiKey;

    public GeoService(@Value("${gogoduk.base-url:https://api.gogoduk.com}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public List<PlaceSuggestion> suggest(String input) {
        if (input == null || input.trim().length() < 2) {
            throw new BadRequestException("Từ khóa tìm kiếm phải có ít nhất 2 ký tự");
        }

        JsonNode body = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/suggest")
                        .queryParam("input", input)
                        .queryParam("lang", "vi")
                        .queryParam("country", "VN")
                        .build())
                .header("X-API-Key", apiKey)
                .retrieve()
                .body(JsonNode.class);

        List<PlaceSuggestion> result = new ArrayList<>();
        if (body != null && body.has("predictions")) {
            for (JsonNode p : body.get("predictions")) {
                result.add(PlaceSuggestion.builder()
                        .placeId(textOrNull(p, "placeId"))
                        .text(textOrNull(p, "text"))
                        .mainText(textOrNull(p, "mainText"))
                        .secondaryText(textOrNull(p, "secondaryText"))
                        .build());
            }
        }
        return result;
    }

    public PlaceDetail resolve(String placeId) {
        if (placeId == null || placeId.isBlank()) {
            throw new BadRequestException("Thiếu placeId");
        }

        JsonNode body = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/place/resolve")
                        .queryParam("id", placeId)
                        .queryParam("lang", "vi")
                        .build())
                .header("X-API-Key", apiKey)
                .retrieve()
                .body(JsonNode.class);

        if (body == null || !body.has("result")) {
            throw new BadRequestException("Không tìm thấy địa chỉ tương ứng");
        }

        JsonNode result = body.get("result");
        return PlaceDetail.builder()
                .placeId(textOrNull(result, "placeId"))
                .formattedAddress(textOrNull(result, "address"))
                .lat(result.has("lat") ? result.get("lat").asDouble() : null)
                .lng(result.has("lon") ? result.get("lon").asDouble() : null) // GoGoDuk trả "lon"
                .build();
    }

    private String textOrNull(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : null;
    }
}