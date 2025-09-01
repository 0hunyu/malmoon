package com.communet.malmoon.storybook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * 장르 목록 응답 DTO
 * 예시 응답: { "classifications": ["의사소통", "자연탐구"] }
 */
@Getter
@AllArgsConstructor
public class ClassificationListResponseDto {
    private List<String> classifications;
}
