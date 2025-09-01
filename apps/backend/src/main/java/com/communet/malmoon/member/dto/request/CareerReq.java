package com.communet.malmoon.member.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class CareerReq {
    private String company;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
}
