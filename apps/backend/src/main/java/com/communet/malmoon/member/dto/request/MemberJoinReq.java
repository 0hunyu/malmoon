package com.communet.malmoon.member.dto.request;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberJoinReq {
	@NotBlank(message = "이메일은 필수입니다.")
	@Email(message = "유효한 이메일 주소를 입력하세요.")
	private String email;
	@NotBlank(message = "비밀번호는 필수입니다.")
	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	private String password;
	@NotBlank(message = "실명은 필수입니다.")
	private String name;
	@NotBlank(message = "닉네임은 필수입니다.")
	private String nickname;
	@NotNull(message = "생년월일은 필수입니다.")
	private LocalDate birthDate;
	@NotBlank(message = "전화번호는 하나 이상 입력이 필수입니다.")
	private String tel1;
	private String tel2;
	@NotNull(message = "프로필을 선택해주세요")
	private Integer profile;
	@NotBlank(message = "시를 선택해주세요")
	private String city;
	@NotBlank(message = "구를 선택해주세요")
	private String district;
	@NotBlank(message = "동를 선택해주세요")
	private String dong;
	private String detail;
}
