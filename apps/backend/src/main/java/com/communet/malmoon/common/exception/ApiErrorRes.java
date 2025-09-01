package com.communet.malmoon.common.exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * API 예외 응답을 위한 표준 응답 포맷 클래스입니다.
 * 모든 예외 상황에서 일관된 구조로 클라이언트에게 에러 정보를 제공합니다.
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApiErrorRes {
	/**
	 * HTTP 상태 코드 (예: 400, 404, 500 등)
	 */
	@Schema(description = "HTTP 상태 코드", example = "400")
	private int status;

	/**
	 * 상태 코드에 대응하는 표준 메시지 (예: Bad Request)
	 */
	@Schema(description = "HTTP 상태 코드 메시지", example = "Bad Request")
	private String error;

	/**
	 * 상세 에러 메시지
	 */
	@Schema(description = "에러 메시지", example = "유효하지 않은 요청입니다.")
	private String message;

	/**
	 * 요청 경로 (선택: 요청 URI 포함 가능)
	 */
	@Schema(description = "요청 URI", example = "/api/v1/aacs/generate")
	private String path;

	/**
	 * 에러 발생 시간 (선택)
	 */
	@Schema(description = "에러 발생 시간 (ISO 8601 형식)", example = "2025-07-30T15:30:00")
	@Builder.Default
	private LocalDateTime timestamp = LocalDateTime.now();

	/**
	 * status, message 기반 생성자 (URI는 선택적으로 세터 또는 builder로 설정)
	 */
	public ApiErrorRes(HttpStatus status, String message) {
		this.status = status.value();
		this.error = status.getReasonPhrase();
		this.message = message;
		this.timestamp = LocalDateTime.now();
	}

}
