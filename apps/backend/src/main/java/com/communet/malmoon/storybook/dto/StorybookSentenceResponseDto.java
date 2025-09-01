package com.communet.malmoon.storybook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 문장 단건 응답 DTO
 * 예시: { "sentenceId": 1, "sentence": "숲 속은 조용했어요.", "sentenceNumber": 1 }
 */
@Getter
@AllArgsConstructor
public class StorybookSentenceResponseDto {
    private Long sentenceId;
    private String sentence;
    private int sentenceNumber;
}
