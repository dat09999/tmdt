package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusLog {

    private String status;          // trạng thái mới
    private String note;            // ghi chú khi chuyển trạng thái
    private String updatedBy;       // userId hoặc "SYSTEM"
    private Date timestamp;
}
