package com.communet.malmoon.member.dto.request;

import java.util.List;

import com.communet.malmoon.member.domain.Career;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberMeChangeReq {
	private String nickname;
	private String tel1;
	private String tel2;
	private Integer profile;
	private String city;
	private String district;
	private String dong;
	private String detail;
	private Integer careerYears;
	private List<CareerReq> careers; // 치료사만 수정 가능
}
