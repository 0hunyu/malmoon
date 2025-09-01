package com.communet.malmoon.diagnostic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;


/** 시작 요청 */
@Getter @Setter
public class AttemptStartRequest {
    @NotNull private Long childId;
    @NotBlank private String ageGroup;     // PRESCHOOL | SCHOOLAGE
}