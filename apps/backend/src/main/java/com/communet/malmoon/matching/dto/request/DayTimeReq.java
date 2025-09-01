package com.communet.malmoon.matching.dto.request;

import com.communet.malmoon.matching.domain.DayType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DayTimeReq {
    private DayType day;
    private Integer time;
}
