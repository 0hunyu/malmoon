package com.communet.malmoon.storybook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 페이지 범위 응답 DTO
 * 예시 응답: { "minPage": 1, "maxPage": 16 }
 */
@Getter
@AllArgsConstructor
public class PageRangeResponseDto {
    private int minPage;
    private int maxPage;
}
