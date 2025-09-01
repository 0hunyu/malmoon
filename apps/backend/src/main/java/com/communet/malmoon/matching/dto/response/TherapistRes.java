package com.communet.malmoon.matching.dto.response;

import com.communet.malmoon.member.dto.response.CareerRes;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class TherapistRes {
    private Long therapistId;
    private String name;
    private String email;
    private String telephone;
    private LocalDate birthDate;
    private Integer profile;
    private Integer careerYears;
    private List<CareerRes> careers;
}
