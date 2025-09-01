package com.communet.malmoon.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.WebRequest;

public class ExceptionResponseUtils {
	public static ApiErrorRes build(HttpStatus status, String message, WebRequest request) {
		return ApiErrorRes.builder()
			.status(status.value())
			.error(status.getReasonPhrase())
			.message(message)
			.path(request.getDescription(false).replace("uri=", ""))
			.build();
	}
}
