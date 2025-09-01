package com.communet.malmoon.storybook.dto;
/**
 * FastAPI 응답 DTO 정의 FastAPI → Spring Boot로 응답할 때 받는 DTO
 * 즉, Spring Boot가 요청을 보낸 뒤 FastAPI로부터 받는 응답(Response Body) 입니다.
 * FastAPI가 응답 JSON을 반환하면, Spring Boot에서는 이 DTO로 역직렬화(파싱)합니다.
 */

import lombok.Data;

@Data
public class FeedbackEvalResponseDto {
    private double accuracy;
    private String evaluation;
    private String strengths;        // ✅ 문자열
    private String improvements;     // ✅ 문자열
    private String recommendations;  // ✅ 문자열
}