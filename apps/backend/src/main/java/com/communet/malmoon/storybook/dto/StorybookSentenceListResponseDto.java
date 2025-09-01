package com.communet.malmoon.storybook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * 문장 목록 응답 DTO
 * 예시 응답:
 * {
 *   "classification": "의사소통",
 *   "title": "숲 속으로 떠나는 음악 여행",
 *   "page": 2,
 *   "sentences": [
 *     { "sentenceId": 1, "sentence": "...", "sentenceNumber": 1 },
 *     ...
 *   ]
 * }
 */
@Getter
@AllArgsConstructor
public class StorybookSentenceListResponseDto {
    private String classification;
    private String title;
    private int page;
    private List<StorybookSentenceResponseDto> sentences;
}
