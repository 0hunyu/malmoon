package com.communet.malmoon.member.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.communet.malmoon.common.exception.ExceptionResponseUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice(basePackages = "com.communet.malmoon.member")
public class MemberExceptionHandler {

	@ExceptionHandler(DuplicateEmailException.class)
	public ResponseEntity<?> handleDuplicate(DuplicateEmailException e, WebRequest request) {
		log.warn("DuplicateEmailException: {}", e.getMessage());
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(ExceptionResponseUtils.build(HttpStatus.CONFLICT, e.getMessage(), request));
	}
}
