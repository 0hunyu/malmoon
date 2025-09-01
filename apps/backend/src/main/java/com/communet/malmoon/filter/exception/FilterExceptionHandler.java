package com.communet.malmoon.filter.exception;

import com.communet.malmoon.common.exception.ApiErrorRes;
import com.communet.malmoon.common.exception.ExceptionResponseUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@Slf4j
@RestControllerAdvice(basePackages = "com.communet.malmoon.filter")
public class FilterExceptionHandler {
    @ExceptionHandler(FilterException.class)
    public ResponseEntity<ApiErrorRes> handleFilterException(FilterException e, WebRequest request) {
        log.warn("FilterException: {}", e.getMessage());
        return ResponseEntity.status(e.getErrorCode().getStatus())
                .body(ExceptionResponseUtils.build(
                        e.getErrorCode().getStatus(),
                        e.getErrorCode().getMessage(),
                        request
                ));
    }
}
