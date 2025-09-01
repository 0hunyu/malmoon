package com.communet.malmoon.matching.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class SchedulePostReq {
    private Long therapistId;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<DayTimeReq> dayTimes;
}
