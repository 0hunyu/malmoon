package com.communet.malmoon.matching.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class TherapistScheduleRes {
    private Long memberId;
    private String memberName;
    private Integer time;
}
