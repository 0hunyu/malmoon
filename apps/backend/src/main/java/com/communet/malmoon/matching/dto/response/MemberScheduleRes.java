package com.communet.malmoon.matching.dto.response;

import com.communet.malmoon.matching.dto.request.DayTimeReq;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class MemberScheduleRes {
    private Long therapistId;
    private String therapistName;
    private Integer time;
}
