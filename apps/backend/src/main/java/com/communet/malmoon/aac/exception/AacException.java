package com.communet.malmoon.aac.exception;

/**
 * AAC 도메인 전용 예외 클래스
 */
public class AacException extends RuntimeException {
	private final AacErrorCode errorCode;
	
	public AacException(AacErrorCode errorCode) {
		super(errorCode.getMessage());
		this.errorCode = errorCode;
	}

	public AacErrorCode getErrorCode() {
		return errorCode;
	}
}
