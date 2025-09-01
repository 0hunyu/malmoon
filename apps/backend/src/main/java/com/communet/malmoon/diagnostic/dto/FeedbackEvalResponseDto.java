package com.communet.malmoon.diagnostic.dto;

import lombok.Data;

@Data
public class FeedbackEvalResponseDto {
    private double accuracy;        // 0~100
    private String evaluation;
    private String strengths;
    private String improvements;
    private String recommendations;
}
