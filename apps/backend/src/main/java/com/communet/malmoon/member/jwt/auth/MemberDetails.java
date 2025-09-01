package com.communet.malmoon.member.jwt.auth;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.communet.malmoon.member.domain.Member;

import lombok.Getter;

// Spring Security에서 사용자의 인증 정보를 담기 위한 클래스
public class MemberDetails implements UserDetails {

	@Getter
	Member member;
	boolean accountNonExpired;
	boolean accountNonLocked;
	boolean credentialNonExpired;
	boolean enabled = true;
	List<GrantedAuthority> roles = new ArrayList<>();

	public MemberDetails(Member member) {
		super();
		this.member = member;
	}

	@Override
	public String getPassword() {
		return this.member.getPassword();
	}
	@Override
	public String getUsername() {
		return this.member.getEmail();
	}
	@Override
	public boolean isAccountNonExpired() {
		return this.accountNonExpired;
	}
	@Override
	public boolean isAccountNonLocked() {
		return this.accountNonLocked;
	}
	@Override
	public boolean isCredentialsNonExpired() {
		return this.credentialNonExpired;
	}
	@Override
	public boolean isEnabled() {
		return this.enabled;
	}
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return this.roles;
	}
	public void setAuthorities(List<GrantedAuthority> roles) {
		this.roles = roles;
	}
}
