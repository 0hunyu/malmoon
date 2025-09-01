package com.communet.malmoon.member.service;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.domain.MemberStatusType;
import com.communet.malmoon.member.domain.MemberType;
import com.communet.malmoon.member.domain.Therapist;
import com.communet.malmoon.member.dto.request.MemberJoinReq;
import com.communet.malmoon.member.dto.request.MemberPasswordChangeReq;
import com.communet.malmoon.member.dto.request.TherapistJoinReq;
import com.communet.malmoon.member.dto.response.MemberMeRes;
import com.communet.malmoon.member.exception.DuplicateEmailException;
import com.communet.malmoon.member.repository.CareerRepository;
import com.communet.malmoon.member.repository.MemberRepository;
import com.communet.malmoon.member.repository.TherapistRepository;

import jakarta.transaction.Transactional;

@SpringBootTest
class MemberServiceTest {

	@Autowired
	private MemberService memberService;

	@Autowired
	private MemberRepository memberRepository;

	@Autowired
	private TherapistRepository therapistRepository;

	@MockitoBean
	private CareerRepository careerRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@BeforeEach
	void cleanup() {
		therapistRepository.deleteAll();
		memberRepository.deleteAll();
	}

	@Test
	@Transactional
	@DisplayName("회원가입 성공")
	void joinSuccess() {
		// given
		MemberJoinReq req = new MemberJoinReq();
		req.setEmail("test@example.com");
		req.setPassword("password123");
		req.setName("김싸피");
		req.setNickname("tester");
		req.setBirthDate(LocalDate.of(1990, 1, 1));
		req.setTel1("01012345678");
		req.setTel2("01087654321");
		req.setCity("서울");
		req.setDistrict("강남");
		req.setDong("금호동");
		req.setDetail("삼성아파트");

		// when
		memberService.join(req);

		// then
		Member saved = memberRepository.findByEmail(("test@example.com")).orElse(null);
		assertNotNull(saved);
		assertEquals("tester", saved.getNickname());
		assertTrue(passwordEncoder.matches("password123", saved.getPassword()));
		assertEquals("서울", saved.getAddress().getCity());
		assertEquals("삼성아파트", saved.getAddress().getDetail());
	}

	@Test
	@Transactional
	@DisplayName("치료사 회원가입 성공")
	void joinTherapistSuccess() {
		// given
		TherapistJoinReq req = new TherapistJoinReq();
		req.setEmail("therapist@example.com");
		req.setPassword("securePassword!");
		req.setName("이치료");
		req.setNickname("healer");
		req.setBirthDate(LocalDate.of(1985, 5, 20));
		req.setTel1("01012345678");
		req.setTel2("01087654321");
		req.setCareerYears(7);
		req.setCity("서울");
		req.setDistrict("강남");
		req.setDong("금호동");
		req.setDetail("삼성아파트");

		MockMultipartFile multipartFile1 = new MockMultipartFile("file", "test.txt", "text/plain", "test file".getBytes(StandardCharsets.UTF_8) );

		// when
		memberService.joinTherapist(req, multipartFile1);

		// then
		Member savedMember = memberRepository.findByEmail("therapist@example.com").orElse(null);
		assertNotNull(savedMember);
		assertEquals("healer", savedMember.getNickname());
		assertEquals(MemberType.ROLE_THERAPIST, savedMember.getRole());
		assertTrue(passwordEncoder.matches("securePassword!", savedMember.getPassword()));

		Therapist savedTherapist = therapistRepository.findById(savedMember.getMemberId()).orElse(null);
		assertNotNull(savedTherapist);
		assertEquals(7, savedTherapist.getCareerYears());
	}

	@Test
	@Transactional
	@DisplayName("중복 이메일 가입 시 예외 발생")
	void joinDuplicateEmail() {
		// given
		MemberJoinReq req = new MemberJoinReq();
		req.setEmail("test@example.com");
		req.setPassword("password123");
		req.setName("김싸피");
		req.setNickname("tester");
		req.setBirthDate(LocalDate.of(1990, 1, 1));
		req.setTel1("01012345678");
		req.setTel2("01087654321");

		memberService.join(req);

		// when & then
		MemberJoinReq dupReq = new MemberJoinReq();
		dupReq.setEmail("test@example.com");
		dupReq.setPassword("password123");
		dupReq.setName("김싸피");
		dupReq.setNickname("tester");
		dupReq.setBirthDate(LocalDate.of(1990, 1, 1));
		dupReq.setTel1("01012345678");
		dupReq.setTel2("01087654321");

		assertThrows(DuplicateEmailException.class, () -> memberService.join(dupReq));
	}

	@Test
	void withdraw_회원탈퇴시_상태가_WITHDRAWN으로_변경된다() {
		// given
		Member member = new Member();
		member.setStatus(MemberStatusType.ACTIVE); // 초기 상태

		// when
		memberService.withdraw(member);

		// then
		assertEquals(MemberStatusType.WITHDRAWN, member.getStatus());
	}

	@Test
	void getMe_withRoleClient_shouldReturnMemberMeResWithoutCareers() {
		Member member = Member.builder()
			.email("client@example.com")
			.password(passwordEncoder.encode("password"))
			.role(MemberType.ROLE_CLIENT)
			.name("클라이언트")
			.nickname("client")
			.birthDate(LocalDate.of(1990, 1, 1))
			.tel1("010")
			.tel2("1234")
			.role(MemberType.ROLE_CLIENT)
			.status(MemberStatusType.ACTIVE)
			.build();

		memberRepository.save(member);

		MemberMeRes result = memberService.getMe(member);

		assertEquals("client@example.com", result.getEmail());
		assertEquals("클라이언트", result.getName());
		assertEquals("client", result.getNickname());
		assertNull(result.getCareers());
	}
}
