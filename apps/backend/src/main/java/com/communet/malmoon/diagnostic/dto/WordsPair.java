package com.communet.malmoon.diagnostic.dto;

import lombok.*;

/** LLM 평가 요청 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WordsPair {
    private String targetText; // 원문
    private String sttText;    // STT로 인식된 문장
}