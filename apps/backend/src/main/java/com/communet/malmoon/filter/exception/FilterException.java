package com.communet.malmoon.filter.exception;

public class FilterException extends RuntimeException {
    private final FilterErrorCode errorCode;

    public FilterException(FilterErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public FilterErrorCode getErrorCode() {
        return errorCode;
    }
}
