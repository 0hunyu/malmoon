package com.communet.malmoon.chat.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.communet.malmoon.common.exception.ApiErrorRes;
import com.communet.malmoon.common.exception.ExceptionResponseUtils;

import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice(basePackages = "com.communet.malmoon.chat")
@Slf4j
public class ChatExceptionHandler {
	@ExceptionHandler(ChatException.class)
	public ResponseEntity<ApiErrorRes> handleChatException(ChatException e, WebRequest request) {
		log.warn("ChatException: {}", e.getMessage());
		return ResponseEntity.status(e.getErrorCode().getStatus())
			.body(ExceptionResponseUtils.build(
				e.getErrorCode().getStatus(),
				e.getErrorCode().getMessage(),
				request
			));
	}
}
