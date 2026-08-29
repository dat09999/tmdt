package com.example.backend.service;

import com.example.backend.DTO.order.ShippingEstimateResponse;
import com.example.backend.module.Address;
import com.example.backend.module.Shop;
import com.example.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@Slf4j
@RequiredArgsConstructor
public class ShippingService {

    private final ShopRepository shopRepository;
    private static final long DEFAULT_SHIPPING_FEE = 30_000L;

    public double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1.3;
    }

    public long calculateShippingFee(double distanceKm) {
        if (distanceKm <= 5)   return 15_000L;
        if (distanceKm <= 15)  return 25_000L;
        if (distanceKm <= 30)  return 35_000L;
        if (distanceKm <= 100) return 45_000L;
        if (distanceKm <= 300) return 55_000L;
        if (distanceKm <= 600) return 75_000L;
        return 90_000L;
    }

    public long calculateShippingFee(Address shopAddress, Address buyerAddress) {
        if (!hasCoordinates(shopAddress) || !hasCoordinates(buyerAddress)) {
            log.warn("Thieu toa do khi tinh phi ship, dung phi mac dinh {}d", DEFAULT_SHIPPING_FEE);
            return DEFAULT_SHIPPING_FEE;
        }
        double distanceKm = calculateDistanceKm(
                shopAddress.getLat(), shopAddress.getLng(),
                buyerAddress.getLat(), buyerAddress.getLng()
        );
        return calculateShippingFee(distanceKm);
    }

    public ShippingEstimateResponse estimate(String shopId, double buyerLat, double buyerLng) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay shop: " + shopId));

        Address shopAddress = shop.getAddress();

        if (!hasCoordinates(shopAddress)) {
            return ShippingEstimateResponse.builder()
                    .distanceKm(0)
                    .shippingFee(DEFAULT_SHIPPING_FEE)
                    .feeLabel(formatVnd(DEFAULT_SHIPPING_FEE))
                    .distanceLabel("Khong xac dinh")
                    .note("Shop chua cap nhat toa do, ap dung phi ship tieu chuan")
                    .build();
        }

        double distanceKm = calculateDistanceKm(
                shopAddress.getLat(), shopAddress.getLng(),
                buyerLat, buyerLng
        );
        double rounded = Math.round(distanceKm * 10.0) / 10.0;
        long fee = calculateShippingFee(distanceKm);

        return ShippingEstimateResponse.builder()
                .distanceKm(rounded)
                .shippingFee(fee)
                .feeLabel(formatVnd(fee))
                .distanceLabel("~" + rounded + " km")
                .note(null)
                .build();
    }

    private boolean hasCoordinates(Address address) {
        return address != null && address.getLat() != null && address.getLng() != null;
    }

    private String formatVnd(long amount) {
        return NumberFormat.getNumberInstance(new Locale("vi", "VN")).format(amount) + " d";
    }
}