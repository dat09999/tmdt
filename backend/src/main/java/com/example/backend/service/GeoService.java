package com.example.backend.service;

import com.example.backend.DTO.place.PlaceDetail;
import com.example.backend.DTO.place.PlaceSuggestion;
import com.example.backend.Exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j

public class GeoService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${gogoduk.api-key}")
    private String apiKey;

    public GeoService(@Value("${gogoduk.base-url:https://api.gogoduk.com}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.objectMapper = new ObjectMapper(); // Tự khởi tạo trực tiếp tại đây
    }
    public List<PlaceSuggestion> suggest(String input) {
        if (input == null || input.trim().length() < 2) {
            return Collections.emptyList(); // Tránh ném Exception 400 ra Frontend khi mới gõ 1 ký tự
        }

        try {
            // 1. Nhận Response dạng String
            String jsonResponse = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/suggest")
                            .queryParam("input", input.trim())
                            .queryParam("lang", "vi")
                            .queryParam("country", "VN")
                            .build())
                    .header("X-API-Key", apiKey)
                    .retrieve()
                    .body(String.class);

            if (jsonResponse == null || jsonResponse.isBlank()) {
                return Collections.emptyList();
            }

            // 2. Parse từ String sang JsonNode bằng ObjectMapper.readTree
            JsonNode body = objectMapper.readTree(jsonResponse);

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
        } catch (Exception e) {
            log.error("Lỗi khi gọi API GoGoDuk suggest: ", e);
            return Collections.emptyList(); // Bắt Exception để tránh ném lỗi 500/400 làm đứng Frontend
        }
    }

    public PlaceDetail resolve(String placeId) {
        if (placeId == null || placeId.isBlank()) {
            throw new BadRequestException("Thiếu placeId");
        }

        try {
            String jsonResponse = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/place/resolve")
                            .queryParam("id", placeId)
                            .queryParam("lang", "vi")
                            .build())
                    .header("X-API-Key", apiKey)
                    .retrieve()
                    .body(String.class);

            if (jsonResponse == null || jsonResponse.isBlank()) {
                throw new BadRequestException("Không nhận được phản hồi từ dịch vụ bản đồ");
            }

            JsonNode body = objectMapper.readTree(jsonResponse);

            if (body == null || !body.has("result")) {
                throw new BadRequestException("Không tìm thấy địa chỉ tương ứng");
            }

            JsonNode result = body.get("result");
            return PlaceDetail.builder()
                    .placeId(textOrNull(result, "placeId"))
                    .formattedAddress(textOrNull(result, "address"))
                    .lat(result.has("lat") && !result.get("lat").isNull() ? result.get("lat").asDouble() : null)
                    .lng(result.has("lon") && !result.get("lon").isNull() ? result.get("lon").asDouble() : null)
                    .build();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi gọi API GoGoDuk resolve: ", e);
            throw new BadRequestException("Xử lý chi tiết địa chỉ thất bại");
        }
    }

    private String textOrNull(JsonNode node, String field) {
        return node != null && node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : null;
    }
}