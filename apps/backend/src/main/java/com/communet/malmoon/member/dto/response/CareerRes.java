package com.communet.malmoon.member.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class CareerRes {
    private Long careerId;
    private String company;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
}
