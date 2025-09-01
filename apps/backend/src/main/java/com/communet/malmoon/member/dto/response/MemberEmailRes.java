package com.communet.malmoon.member.dto.response;

import lombok.Getter;

@Getter
public class MemberEmailRes {
	private final boolean duplicate;

	public MemberEmailRes(boolean duplicate) {
		this.duplicate = duplicate;
	}
}
