package com.communet.malmoon.storybook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * 제목 목록 응답 DTO
 * 예시 응답: { "titles": ["숲 속으로 떠나는 음악 여행", "아기 토끼의 모험"] }
 */
@Getter
@AllArgsConstructor
public class TitleListResponseDto {
    private List<String> titles;
}
