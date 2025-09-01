package com.communet.malmoon.matching.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class MemberPendingRes {
    private Long scheduleId;
    private Long memberId;
    private String name;
    private String email;
    private String telephone;
    private LocalDateTime createDate;
    private String evaluation;
    private String improvements;
    private String recommendations;
    private String strengths;
}
