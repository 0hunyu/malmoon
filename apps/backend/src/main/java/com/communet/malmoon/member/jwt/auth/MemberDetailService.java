package com.communet.malmoon.member.jwt.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.communet.malmoon.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

/**
 * 현재 액세스 토큰으로부터 인증된 사용자의 상세 정보를 제공하는 서비스 클래스
 * - 사용자 활성화 상태, 계정 만료 여부, 권한(롤) 정보 등을 포함
 * - Spring Security의 UserDetailsService를 구현하여 사용자 조회 기능 제공
 */
@Component
@RequiredArgsConstructor
public class MemberDetailService implements UserDetailsService {

	private final MemberRepository memberRepository;

	/**
	 * 사용자의 이름(username, 여기서는 이메일)을 기반으로 회원 정보를 조회하여 UserDetails 반환
	 * @param username - 인증에 사용되는 사용자 이름(이메일)
	 * @return 인증에 필요한 사용자 상세 정보(MemberDetails)
	 * @throws UsernameNotFoundException - 해당 사용자가 없을 경우 던질 수 있음 (현재는 orElse(null) 처리)
	 */
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		return memberRepository.getByEmail(username)
			.map(MemberDetails::new)
			.orElse(null);
	}
}

