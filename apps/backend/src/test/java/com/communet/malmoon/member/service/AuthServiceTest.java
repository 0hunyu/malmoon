package com.communet.malmoon.member.service;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;

import com.communet.malmoon.member.dto.response.MemberLoginRes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.domain.MemberStatusType;
import com.communet.malmoon.member.domain.MemberType;
import com.communet.malmoon.member.dto.request.MemberLoginReq;
import com.communet.malmoon.member.repository.MemberRepository;

import jakarta.transaction.Transactional;

@SpringBootTest
class AuthServiceTest {

	@Autowired
	private AuthService authService;

	@Autowired
	private MemberRepository memberRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@BeforeEach
	void setup() {
		memberRepository.deleteAll();

		Member member = Member.builder()
			.email("login@test.com")
			.password(passwordEncoder.encode("correctPassword"))
			.name("테스터")
			.nickname("tester")
			.birthDate(LocalDate.of(1990, 1, 1))
			.tel1("01011112222")
			.tel2("01033334444")
			.role(MemberType.ROLE_CLIENT)
			.status(MemberStatusType.ACTIVE)
			.build();

		memberRepository.save(member);
	}

	@Test
	@Transactional
	@DisplayName("로그인 성공")
	void loginSuccess() {
		// given
		MemberLoginReq req = new MemberLoginReq();
		req.setEmail("login@test.com");
		req.setPassword("correctPassword");

		// when
		MemberLoginRes memberLoginRes = authService.login(req);
		String token = memberLoginRes.getAccessToken();

		// then
		assertNotNull(token);
		System.out.println("발급된 토큰: " + token);
	}

	@Test
	@Transactional
	@DisplayName("존재하지 않는 이메일로 로그인 시도")
	void loginFail_userNotFound() {
		// given
		MemberLoginReq req = new MemberLoginReq();
		req.setEmail("wrong@test.com");
		req.setPassword("anyPassword");

		// then
		assertThrows(UsernameNotFoundException.class, () -> authService.login(req));
	}

	@Test
	@Transactional
	@DisplayName("비밀번호 틀릴 경우 로그인 실패")
	void loginFail_wrongPassword() {
		// given
		MemberLoginReq req = new MemberLoginReq();
		req.setEmail("login@test.com");
		req.setPassword("wrongPassword");

		// then
		assertThrows(BadCredentialsException.class, () -> authService.login(req));
	}
}

