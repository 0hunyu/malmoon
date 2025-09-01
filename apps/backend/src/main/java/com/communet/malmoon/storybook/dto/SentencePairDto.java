package com.communet.malmoon.storybook.dto;
/**
 * FastAPI 요청 DTO 정의
 * Spring Boot가 FastAPI에 보낼 평가 요청 데이터
 */

import lombok.Data;

@Data
public class SentencePairDto {
    private Long sentenceId;   // null 가능
    private String original;
    private String stt;
}