package com.communet.malmoon.common.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.communet.malmoon.common.auth.CurrentMemberArgumentResolver;
import com.communet.malmoon.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.web.servlet.config.annotation.CorsRegistry;


@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

	private final MemberRepository memberRepository;

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(new CurrentMemberArgumentResolver(memberRepository));
	}
	  @Override
	  public void addCorsMappings(CorsRegistry registry) {
	      registry.addMapping("/**")
	          .allowedOrigins("http://localhost:3000") // React 개발 서버 주소
	          .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
	          .allowedHeaders("*")
	          .allowCredentials(true);
	  }
}
