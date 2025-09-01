package com.communet.malmoon.matching.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ScheduleGetReq {
    private Long therapistId;
    private LocalDate startDate;
    private LocalDate endDate;
}
