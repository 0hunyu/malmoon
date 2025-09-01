package com.communet.malmoon.matching.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class MyTherapistScheduleRes {
    private Long scheduleId;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<DayTimeRes> dayTimes;
    private TherapistRes therapist;
}