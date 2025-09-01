package com.communet.malmoon.member.controller;

import com.communet.malmoon.member.domain.Member;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.communet.malmoon.member.dto.request.MemberLoginReq;
import com.communet.malmoon.member.dto.response.MemberLoginRes;
import com.communet.malmoon.member.service.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

	private final AuthService authService;

	/**
	 * 로그인 API
	 * @param memberLoginReq 사용자로부터 받은 로그인 요청 정보(email, password)
	 * @return JWT access token을 담은 응답 객체
	 */
	@PostMapping("/login")
	public ResponseEntity<MemberLoginRes> login(@RequestBody MemberLoginReq memberLoginReq) {
		MemberLoginRes memberLoginRes = authService.login(memberLoginReq);
		return ResponseEntity.ok(memberLoginRes);
	}
}
