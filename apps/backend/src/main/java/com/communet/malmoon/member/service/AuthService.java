package com.communet.malmoon.member.service;

import com.communet.malmoon.member.dto.response.MemberLoginRes;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.dto.request.MemberLoginReq;
import com.communet.malmoon.member.jwt.util.JwtTokenUtil;
import com.communet.malmoon.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	/**
	 * 로그인 처리
	 * 1. 이메일로 회원 조회
	 * 2. 비밀번호 검증
	 * 3. JWT 토큰 생성 후 반환
	 * @param memberLoginReq 로그인 요청 DTO(email, password)
	 * @return JWT 액세스 토큰 문자열
	 * @throws UsernameNotFoundException 사용자가 없으면 발생
	 * @throws BadCredentialsException 비밀번호가 틀리면 발생
	 */
	public MemberLoginRes login(MemberLoginReq memberLoginReq) {

		Member member = memberRepository.getByEmail(memberLoginReq.getEmail())
			.orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));

		if (!passwordEncoder.matches(memberLoginReq.getPassword(), member.getPassword())) {
			throw new BadCredentialsException("비밀번호가 일치하지 않습니다.");
		}

        return MemberLoginRes.builder()
                .accessToken(JwtTokenUtil.getToken(member.getEmail(), member.getRole()))
                .memberId(member.getMemberId())
                .email(member.getEmail())
                .role(member.getRole())
                .tel1(member.getTel1())
                .tel2(member.getTel2())
                .name(member.getName())
                .nickname(member.getNickname())
                .birthDate(member.getBirthDate())
                .profile(member.getProfile())
                .build();
	}
}
