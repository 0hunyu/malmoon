package com.communet.malmoon.aac.domain;

public enum AacStatus {
	DEFAULT,
	PUBLIC,
	PRIVATE,
	DELETED;

	public boolean isPrivate() {
		return this == PRIVATE;
	}
}
