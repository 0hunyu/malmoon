package com.communet.malmoon.member.dto.response;

import com.communet.malmoon.member.domain.Address;
import com.communet.malmoon.member.domain.MemberStatusType;
import com.communet.malmoon.member.domain.MemberType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class MemberLoginRes {
	private String accessToken;
	private Long memberId;
	private String email;
	private String name;
	private String nickname;
	private LocalDate birthDate;
	private String tel1;
	private String tel2;
	private MemberType role;
	private Integer profile;
}
