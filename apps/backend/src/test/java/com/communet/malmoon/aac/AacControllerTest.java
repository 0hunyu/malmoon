package com.communet.malmoon.aac;

import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.communet.malmoon.aac.controller.AacController;
import com.communet.malmoon.aac.domain.AacStatus;
import com.communet.malmoon.aac.dto.request.AacConfirmReq;
import com.communet.malmoon.aac.dto.request.AacCreateReq;
import com.communet.malmoon.aac.dto.request.AacGetReq;
import com.communet.malmoon.aac.dto.response.AacGetRes;
import com.communet.malmoon.aac.service.AacService;
import com.communet.malmoon.common.auth.CurrentMemberArgumentResolver;
import com.communet.malmoon.common.config.SecurityConfig;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.domain.MemberStatusType;
import com.communet.malmoon.member.domain.MemberType;
import com.communet.malmoon.member.repository.MemberRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * {@link AacController}에 대한 단위 테스트 클래스입니다.
 * Spring MVC의 {@link MockMvc}를 활용하여 컨트롤러 계층의 동작을 검증합니다.
 * 주요 테스트 항목:
 *     AAC 목록 조회
 *     AAC 이미지 생성
 *     AAC 상세 조회
 *     AAC 생성 확정
 *     사용자 정의 AAC 삭제
 * 테스트에서는 {@link WebMvcTest}를 사용하며,
 * 인증된 사용자로서의 요청을 위해 {@link WithMockUser}를 설정하고
 * {@link CurrentMemberArgumentResolver}를 테스트용으로 주입합니다.
 *
 * @author 말문
 */
@WithMockUser(username = "test@example.com", roles = "THERAPIST")
@AutoConfigureMockMvc(addFilters = false)
@Import({AacControllerTest.TestConfig.class, SecurityConfig.class})
@WebMvcTest(AacController.class)
public class AacControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	/**
	 * 테스트용 {@link AacService}, {@link MemberRepository},
	 * {@link CurrentMemberArgumentResolver}를 설정하는 내부 구성 클래스입니다.
	 */
	@TestConfiguration
	static class TestConfig implements WebMvcConfigurer {

		/**
		 * Mock AacService 빈 등록
		 * @return Mockito로 생성한 AacService
		 */
		@Bean
		@Primary
		public AacService aacService() {
			return mock(AacService.class);
		}

		/**
		 * 이메일 기반으로 Mock 사용자 정보를 반환하는 {@link MemberRepository}
		 * @return Mockito로 생성한 MemberRepository
		 */
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

		/**
		 * {@link @CurrentMember}를 처리하는 ArgumentResolver 등록
		 * @param memberRepository mock 회원 저장소
		 * @return ArgumentResolver
		 */
		@Bean
		public CurrentMemberArgumentResolver currentMemberArgumentResolver(MemberRepository memberRepository) {
			return new CurrentMemberArgumentResolver(memberRepository);
		}

		@Override
		public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
			resolvers.add(currentMemberArgumentResolver(memberRepository()));
		}
	}

	@Autowired
	private AacService aacService;

	/**
	 * AAC 목록 조회 API 테스트
	 * 예상 결과: 200 OK, 첫 번째 항목의 name은 "기쁨"
	 */
	@Test
	@DisplayName("AAC 목록 조회 성공")
	void getAacList_success() throws Exception {
		// given - 임의의 AAC 데이터 생성
		AacGetRes mockRes = AacGetRes.builder()
			.id(1L)
			.name("기쁨")
			.situation("생일")
			.emotion("행복")
			.action("웃기")
			.description("생일 선물을 받아 기쁜 상황")
			.fileId("https://s3.amazonaws.com/bucket/image.png")
			.status(AacStatus.PUBLIC)
			.build();

		Page<AacGetRes> mockPage = new PageImpl<>(List.of(mockRes), PageRequest.of(0, 10), 1);
		// 💡 AacGetReq를 직접 만들어서 service mock에 넘김
		AacGetReq req = AacGetReq.builder()
			.situation(null)
			.action(null)
			.emotion(null)
			.page(0)
			.size(10)
			.build();

		given(aacService.getAacList(refEq(req), eq(1L))) // 또는 any(AacGetReq.class)
			.willReturn(mockPage);

		// when & then
		mockMvc.perform(get("/api/v1/aacs")
				.param("page", "0")
				.param("size", "10"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content[0].name").value("기쁨"));
	}

	/**
	 * AAC 이미지 생성 요청 테스트
	 * 예상 결과: 200 OK, previewUrl 반환
	 */
	@Test
	@DisplayName("AAC 이미지 생성 성공")
	void generateAacImage_success() throws Exception {
		// given
		AacCreateReq req = new AacCreateReq("학교", "공부", "신남", "");
		String previewUrl = "http://example.com/image.jpg";
		given(aacService.requestPreviewFromFastApi(any())).willReturn(previewUrl);

		// when & then
		mockMvc.perform(post("/api/v1/aacs/generate")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.previewUrl").value(previewUrl));
	}

	/**
	 * AAC 상세 조회 API 테스트
	 * 예상 결과: 200 OK, name은 "슬픔"
	 */
	@Test
	@DisplayName("AAC 상세 조회 성공")
	void getAacDetail_success() throws Exception {
		// given
		AacGetRes mockRes = AacGetRes.builder()
			.id(1L)
			.name("슬픔")
			.description("울고 있는 상황")
			.build();

		given(aacService.getAacDetail(1L)).willReturn(mockRes);

		// when & then
		mockMvc.perform(get("/api/v1/aacs/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("슬픔"));
	}

	/**
	 * AAC 생성 확정 API 테스트
	 * 예상 결과: 200 OK
	 */
	@Test
	@DisplayName("AAC 생성 확정 성공")
	void confirmAacImage_success() throws Exception {
		// given
		AacConfirmReq req = AacConfirmReq.builder()
			.name("기쁨")
			.description("기쁜 상황")
			.situation("생일")
			.action("웃다")
			.emotion("행복")
			.reason("생일 케이크")
			.imagePath("/temp/path.jpg")
			.status(AacStatus.PRIVATE)
			.build();

		// when & then
		mockMvc.perform(post("/api/v1/aacs/confirm")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
			.andExpect(status().isOk());
	}

	/**
	 * 사용자 정의 AAC soft delete API 테스트
	 * 예상 결과: 200 OK
	 */
	@Test
	@DisplayName("사용자 정의 AAC 삭제 성공")
	void softDeleteCustomAac_success() throws Exception {
		// when & then
		mockMvc.perform(patch("/api/v1/aacs/custom/1"))
			.andExpect(status().isOk());
	}

}
