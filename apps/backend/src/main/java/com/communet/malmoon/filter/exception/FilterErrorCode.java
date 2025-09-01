package com.communet.malmoon.filter.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum FilterErrorCode {
    NOT_FOUND(HttpStatus.NOT_FOUND, "필터 묶음을 찾을 수 없습니다."),
    FILTER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 필터가 존재하지 않습니다."),
    UNAUTHORIZED_ACCESS(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    REQUEST_FILTER_NOT_FOUND(HttpStatus.BAD_REQUEST, "요청에 필터 ID가 없습니다."),
    DUPLICATED_FILTER_IN_SET(HttpStatus.BAD_REQUEST, "중복된 필터가 존재합니다.");

    private final HttpStatus status;
    private final String message;

    FilterErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
