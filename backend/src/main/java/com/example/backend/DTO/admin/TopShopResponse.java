package com.example.backend.DTO.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopShopResponse {
    private String shopId;
    private String shopName;
    private long revenue;
    private long orderCount;
    private long productCount;
}
