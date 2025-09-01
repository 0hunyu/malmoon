package com.communet.malmoon.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MemberPasswordChangeReq {
	@NotBlank(message = "현재 비밀번호를 입력해주세요.")
	private String currentPassword;
	@NotBlank(message = "새 비밀번호를 입력해주세요.")
	private String newPassword;
}
