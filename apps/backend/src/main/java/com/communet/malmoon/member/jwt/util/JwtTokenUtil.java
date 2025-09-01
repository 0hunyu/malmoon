package com.communet.malmoon.member.jwt.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.*;
import com.communet.malmoon.member.domain.MemberType;

import jakarta.annotation.PostConstruct;

/**
 * JWT 토큰 관련 유틸리티 클래스
 * - 토큰 생성, 검증, 만료시간 계산, 예외 처리 기능 제공
 */
@Component
public class JwtTokenUtil {

	@Value("${jwt.secret}")
	private String secret; // 인스턴스 필드

	@Value("${jwt.expiration}")
	private Integer expiration;

	public static String secretKey; // static 필드
	public static int expirationTime;

	@PostConstruct
	public void init() {
		secretKey = secret;
		expirationTime = expiration;
	}

	public static final String TOKEN_PREFIX = "Bearer ";
	public static final String HEADER_STRING = "Authorization";
	public static final String ISSUER = "malmoon.communet.com";

	/**
	 * JWTVerifier 생성
	 * - 토큰 검증 시 사용하는 객체
	 * @return JWTVerifier 인스턴스
	 */
	public static JWTVerifier getVerifier() {
		return JWT
			.require(Algorithm.HMAC512(secretKey.getBytes()))
			.withIssuer(ISSUER)
			.build();
	}

	/**
	 * JWT 토큰 생성 (email, 회원 유형 기반)
	 * @param email 사용자 이메일(토큰 subject)
	 * @param memberType 사용자 타입(권한 정보)
	 * @return 생성된 JWT 토큰 문자열
	 */
	public static String getToken(String email, MemberType memberType) {
		Date expires = JwtTokenUtil.getTokenExpiration(expirationTime);
		return JWT.create()
			.withSubject(email)
			.withClaim("role", memberType.name())
			.withExpiresAt(expires)
			.withIssuer(ISSUER)
			.withIssuedAt(Date.from(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant()))
			.sign(Algorithm.HMAC512(secretKey.getBytes()));
	}

	/**
	 * 현재 시점부터 만료시간(ms) 후 만료일 계산
	 * @param expirationTime 만료 시간 (밀리초 단위)
	 * @return 만료일(Date)
	 */
	public static Date getTokenExpiration(int expirationTime) {
		Date now = new Date();
		return new Date(now.getTime() + expirationTime);
	}

	/**
	 * JWT 토큰 검증 및 예외 처리 메서드
	 * @param token 검증할 JWT 토큰 문자열 (Bearer 접두어 포함)
	 * @throws JWTVerificationException 검증 실패 시 각종 예외 던짐
	 */
	public static void handleError(String token) {
		JWTVerifier verifier = JWT
			.require(Algorithm.HMAC512(secretKey.getBytes()))
			.withIssuer(ISSUER)
			.build();

		try {
			verifier.verify(token.replace(TOKEN_PREFIX, ""));
		} catch (AlgorithmMismatchException ex) {
			throw ex;
		} catch (InvalidClaimException ex) {
			throw ex;
		} catch (SignatureGenerationException ex) {
			throw ex;
		} catch (SignatureVerificationException ex) {
			throw ex;
		} catch (TokenExpiredException ex) {
			throw ex;
		} catch (JWTCreationException ex) {
			throw ex;
		} catch (JWTDecodeException ex) {
			throw ex;
		} catch (JWTVerificationException ex) {
			throw ex;
		} catch (Exception ex) {
			throw ex;
		}
	}
}
