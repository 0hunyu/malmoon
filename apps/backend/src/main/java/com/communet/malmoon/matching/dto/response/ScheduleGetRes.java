package com.communet.malmoon.matching.dto.response;

import com.communet.malmoon.matching.dto.request.DayTimeReq;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleGetRes {
    private List<DayTimeReq> dayTimes;
}
