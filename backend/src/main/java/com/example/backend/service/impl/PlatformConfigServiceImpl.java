package com.example.backend.service.impl;

import com.example.backend.module.PlatformConfig;
import com.example.backend.repository.PlatformConfigRepository;
import com.example.backend.service.PlatformConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
@RequiredArgsConstructor
public class PlatformConfigServiceImpl implements PlatformConfigService {

    private final PlatformConfigRepository platformConfigRepository;
    private static final String DEFAULT_ID = "DEFAULT";

    @Override
    public PlatformConfig getConfig() {
        return platformConfigRepository.findById(DEFAULT_ID)
                .orElseGet(() -> platformConfigRepository.save(PlatformConfig.builder()
                        .id(DEFAULT_ID)
                        .commissionRate(5.0)
                        .updatedAt(new Date())
                        .updatedBy("SYSTEM")
                        .build()));
    }

    @Override
    public PlatformConfig updateCommissionRate(Double newRate, String adminId) {
        if (newRate == null || newRate < 0 || newRate > 100) {
            throw new IllegalArgumentException("Tỷ lệ hoa hồng phải từ 0% đến 100%");
        }
        PlatformConfig config = getConfig();
        config.setCommissionRate(newRate);
        config.setUpdatedAt(new Date());
        config.setUpdatedBy(adminId != null ? adminId : "ADMIN");
        return platformConfigRepository.save(config);
    }
}
