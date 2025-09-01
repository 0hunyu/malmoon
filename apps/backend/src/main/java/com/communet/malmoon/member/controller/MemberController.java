package com.communet.malmoon.member.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.dto.request.MemberJoinReq;
import com.communet.malmoon.member.dto.request.MemberMeChangeReq;
import com.communet.malmoon.member.dto.request.MemberPasswordChangeReq;
import com.communet.malmoon.member.dto.request.TherapistJoinReq;
import com.communet.malmoon.member.dto.response.MemberEmailRes;
import com.communet.malmoon.member.service.MemberService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class MemberController {

	private final MemberService memberService;

	/**
	 * 일반 회원 가입 API
	 * @param memberJoinReq 회원 가입 요청 DTO
	 * @return 201 CREATED
	 */
	@PostMapping("/members")
	public ResponseEntity<?> join(@RequestBody @Valid MemberJoinReq memberJoinReq) {
		memberService.join(memberJoinReq);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

	/**
	 * 치료사 회원 가입 API
	 * @param therapistJoinReqJson 치료사 가입 요청 DTO
	 * @return 201 CREATED
	 */
	@PostMapping("/therapists")
	public ResponseEntity<?> joinTherapist(
			@RequestPart("therapistJoinReq") String therapistJoinReqJson,
			@RequestPart(value = "qualification") MultipartFile qualification) throws JsonProcessingException {
		ObjectMapper objectMapper = new ObjectMapper();
		objectMapper.registerModule(new JavaTimeModule());
		TherapistJoinReq therapistJoinReq = objectMapper.readValue(therapistJoinReqJson, TherapistJoinReq.class);

		memberService.joinTherapist(therapistJoinReq, qualification);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

	/**
	 * 회원 탈퇴 API
	 * @param member 현재 로그인한 회원 (커스텀 어노테이션으로 주입됨)
	 * @return 204 NO CONTENT
	 */
	@DeleteMapping("/members")
	public ResponseEntity<?> withdraw(@CurrentMember Member member) {
		memberService.withdraw(member);
		return ResponseEntity.noContent().build();
	}

	/**
	 * 이메일 중복 확인 API
	 * @param email 중복 확인할 이메일
	 * @return 이메일 중복 여부 (`true`이면 중복됨)
	 */
	@GetMapping("/members/email")
	public ResponseEntity<?> checkEmail(@RequestParam String email) {
		boolean exists = memberService.checkEmail(email);
		return ResponseEntity.ok(new MemberEmailRes(exists));
	}

	/**
	 * 내 정보 조회 API
	 * @param member 현재 로그인한 회원
	 * @return 회원 정보 응답 DTO
	 */
	@GetMapping("/members/me")
	public ResponseEntity<?> getMe(@CurrentMember Member member) {
		return ResponseEntity.ok(memberService.getMe(member));
	}

	/**
	 * 내 정보 수정 API
	 * @param memberMeChangeReq 수정할 정보 요청 DTO
	 * @param member 현재 로그인한 회원
	 * @return 200 OK
	 */
	@PatchMapping("/members/me")
	public ResponseEntity<?> changeMe(@RequestBody MemberMeChangeReq memberMeChangeReq, @CurrentMember Member member) {
		memberService.changeMe(memberMeChangeReq, member);
		return ResponseEntity.ok().build();
	}

	/**
	 * 비밀번호 변경 API
	 * @param req 비밀번호 변경 요청 DTO (현재 비밀번호, 새 비밀번호)
	 * @param member 현재 로그인한 회원
	 * @return 200 OK
	 */
	@PatchMapping("/members/me/password")
	public ResponseEntity<?> changePassword(
		@RequestBody @Valid MemberPasswordChangeReq req,
		@CurrentMember Member member
	) {
		memberService.changePassword(req, member);
		return ResponseEntity.ok().build();
	}
//
//	@GetMapping("/whoami")
//	@PreAuthorize("hasRole('ROLE_THERAPIST')")
//	public ResponseEntity<?> whoami(Authentication authentication) {
//		return ResponseEntity.ok(authentication);
//	}
}
