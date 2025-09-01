package com.communet.malmoon.storybook.dto;
/**
 * AI 피드백 상세정보 응답용 DTO
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedbackDetailResponseDto {
    private String storybookTitle;
    private double accuracy;

    private String evaluation;
    private String strengths;
    private String improvements;
    private String recommendations;
}