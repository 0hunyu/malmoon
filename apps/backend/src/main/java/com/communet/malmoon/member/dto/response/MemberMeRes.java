package com.communet.malmoon.member.dto.response;

import java.time.LocalDate;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class MemberMeRes {
	private String email;
	private String name;
	private String nickname;
	private LocalDate birthDate;
	private Integer profile;
	private String tel1;
	private String tel2;
	private String city;
	private String district;
	private String dong;
	private String detail;
	private String fileUrl;
	private Integer careerYears;
	private List<CareerRes> careers;
}
