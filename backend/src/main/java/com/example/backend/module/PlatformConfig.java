package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "platform_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformConfig {

    @Id
    @Builder.Default
    private String id = "DEFAULT";

    /**
     * Tỷ lệ chiết khấu / hoa hồng sàn thu trên mỗi đơn hàng (đơn vị: %, ví dụ 5.0 = 5%)
     */
    @Builder.Default
    private Double commissionRate = 5.0;

    private Date updatedAt;
    private String updatedBy;
}
