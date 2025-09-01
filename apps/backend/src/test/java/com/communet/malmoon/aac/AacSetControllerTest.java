package com.communet.malmoon.aac;

import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.communet.malmoon.aac.controller.AacSetController;
import com.communet.malmoon.aac.dto.request.AacSetCreateReq;
import com.communet.malmoon.aac.dto.request.AacSetUpdateReq;
import com.communet.malmoon.aac.dto.response.AacSetCreateRes;
import com.communet.malmoon.aac.dto.response.AacSetDetailRes;
import com.communet.malmoon.aac.dto.response.AacSetSimpleRes;
import com.communet.malmoon.aac.service.AacSetService;
import com.communet.malmoon.common.auth.CurrentMemberArgumentResolver;
import com.communet.malmoon.common.config.SecurityConfig;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.domain.MemberStatusType;
import com.communet.malmoon.member.domain.MemberType;
import com.communet.malmoon.member.repository.MemberRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(AacSetController.class)
@WithMockUser(username = "test@example.com", roles = "THERAPIST")
@Import({AacSetControllerTest.TestConfig.class, SecurityConfig.class})
public class AacSetControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private AacSetService aacSetService;

	@TestConfiguration
	static class TestConfig implements WebMvcConfigurer {

		@Bean
		@Primary
		public AacSetService aacSetService() {
			return mock(AacSetService.class);
		}

		@Bean
		@Primary
		public MemberRepository memberRepository() {
			Member mockMember = Member.builder()
				.memberId(1L)
				.email("test@example.com")
				.role(MemberType.ROLE_THERAPIST)
				.status(MemberStatusType.ACTIVE)
				.build();

			MemberRepository repository = mock(MemberRepository.class);
			given(repository.findByEmail("test@example.com")).willReturn(Optional.of(mockMember));
			return repository;
		}

		@Bean
		public CurrentMemberArgumentResolver currentMemberArgumentResolver(MemberRepository memberRepository) {
			return new CurrentMemberArgumentResolver(memberRepository);
		}

		@Override
		public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
			resolvers.add(currentMemberArgumentResolver(memberRepository()));
		}
	}

	@Test
	@DisplayName("AAC 묶음 생성 성공")
	void createAacSet_success() throws Exception {
		// given
		AacSetCreateReq req = new AacSetCreateReq("감정 묶음", "감정을 표현하는 AAC", List.of(1L, 2L));
		AacSetCreateRes res = new AacSetCreateRes(1L);

		given(aacSetService.createAacSet(any(), eq(1L))).willReturn(res);

		// when & then
		mockMvc.perform(post("/api/v1/aacs/sets/create")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.aacSetId").value(1L));
	}

	@Test
	@DisplayName("내 AAC 묶음 목록 조회 성공")
	void getMyAacSets_success() throws Exception {
		// given
		AacSetSimpleRes set1 = new AacSetSimpleRes(1L, "기본 감정", "감정을 나타냄", LocalDateTime.now());
		AacSetSimpleRes set2 = new AacSetSimpleRes(2L, "상황별 표현", "특정 상황 대응", LocalDateTime.now());
		given(aacSetService.getMyAacSets(eq(1L))).willReturn(List.of(set1, set2));

		// when & then
		mockMvc.perform(get("/api/v1/aacs/sets/my"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.size()").value(2))
			.andExpect(jsonPath("$[0].name").value("기본 감정"));
	}

	@Test
	@DisplayName("특정 AAC 묶음 상세 조회 성공")
	void getAacItemsInSet_success() throws Exception {
		AacSetDetailRes detail1 = AacSetDetailRes.builder()
			.id(1L)
			.name("도와줘")
			.situation("긴급")
			.action("도움 요청")
			.emotion("불안")
			.fileId(101L)
			.orderNo(1)
			.build();

		AacSetDetailRes detail2 = AacSetDetailRes.builder()
			.id(2L)
			.name("괜찮아")
			.situation("안정")
			.action("위로")
			.emotion("평온")
			.fileId(102L)
			.orderNo(2)
			.build();

		given(aacSetService.getAacInset(eq(1L), eq(1L)))
			.willReturn(List.of(detail1, detail2));

		// when & then
		mockMvc.perform(get("/api/v1/aacs/sets/my/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.size()").value(2))
			.andExpect(jsonPath("$[0].name").value("도와줘"))
			.andExpect(jsonPath("$[0].orderNo").value(1))
			.andExpect(jsonPath("$[1].name").value("괜찮아"))
			.andExpect(jsonPath("$[1].orderNo").value(2));
	}

	@Test
	@DisplayName("AAC 묶음 수정 성공")
	void updateAacSet_success() throws Exception {
		// given
		AacSetUpdateReq req = new AacSetUpdateReq();
		req.setName("새 묶음 이름");
		req.setDescription("업데이트 설명");
		req.setAacItemIds(List.of(3L, 4L));

		// when & then
		mockMvc.perform(patch("/api/v1/aacs/sets/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
			.andExpect(status().isOk());

		// then - 서비스 메서드 호출 검증
		verify(aacSetService).updateAacSet(eq(1L), any(AacSetUpdateReq.class), eq(1L));
	}

	@Test
	@DisplayName("AAC 묶음 삭제 성공")
	void deleteAacSet_success() throws Exception {
		// when & then
		mockMvc.perform(delete("/api/v1/aacs/sets/1"))
			.andExpect(status().isNoContent());
	}
}
