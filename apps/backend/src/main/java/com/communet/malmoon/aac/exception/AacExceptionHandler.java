package com.communet.malmoon.aac.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.communet.malmoon.common.exception.ApiErrorRes;
import com.communet.malmoon.common.exception.ExceptionResponseUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice(basePackages = "com.communet.malmoon.aac")
public class AacExceptionHandler {
	@ExceptionHandler(AacException.class)
	public ResponseEntity<ApiErrorRes> handleAacException(AacException e, WebRequest request) {
		log.warn("AacException: {}", e.getMessage());
		return ResponseEntity.status(e.getErrorCode().getStatus())
			.body(ExceptionResponseUtils.build(
				e.getErrorCode().getStatus(),
				e.getErrorCode().getMessage(),
				request
			));
	}
}
