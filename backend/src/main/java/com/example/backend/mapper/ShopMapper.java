package com.example.backend.mapper;

import com.example.backend.DTO.common.AddressResponse;
import com.example.backend.DTO.shop.ShopResponse;
import com.example.backend.module.Address;
import com.example.backend.module.Shop;
import com.example.backend.service.impl.ObjectStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ShopMapper {
    @Value("${minio.bucket-name}")
    private  String bucket;
    private final ObjectStorageService objectStorageService;
    public ShopResponse toResponse(Shop shop) {
        if (shop == null) {
            return null;
        }

        return ShopResponse.builder()
                .id(shop.getId())
                .ownerId(shop.getOwnerId())
                .shopName(shop.getShopName())
                .description(shop.getDescription())
                .logo(toMediaUrl(shop.getLogo()))
                .coverImage(toMediaUrl(shop.getCoverImage()))
                .status(shop.getStatus())

                .phone(shop.getPhone())
                .email(shop.getEmail())
                .address(toAddressResponse(shop.getAddress()))

                .rating(shop.getRating() != null ? shop.getRating() : 0.0)
                .totalReviews(shop.getTotalReviews() != null ? shop.getTotalReviews() : 0)
                .totalSales(shop.getTotalSales() != null ? shop.getTotalSales() : 0)

                .createdAt(shop.getCreatedAt())
                .updatedAt(shop.getUpdatedAt())
                .build();
    }

    public List<ShopResponse> toResponseList(List<Shop> shops) {
        if (shops == null) {
            return List.of();
        }

        return shops.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private AddressResponse toAddressResponse(Address address) {
        if (address == null) {
            return null;
        }

        return AddressResponse.builder()
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .detail(address.getDetail())
                .ward(address.getWard())
                .district(address.getDistrict())
                .province(address.getProvince())
                .build();
    }

    private String toMediaUrl(String key) {
        return key == null || key.isBlank()
                ? null
                : objectStorageService.getPublicUrlOrSignedUrl(bucket, key);
    }
}
