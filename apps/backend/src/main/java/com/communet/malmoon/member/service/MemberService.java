package com.communet.malmoon.member.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.communet.malmoon.file.domain.FileType;
import com.communet.malmoon.file.dto.response.FileUploadRes;
import com.communet.malmoon.file.service.FileService;
import com.communet.malmoon.member.domain.Address;
import com.communet.malmoon.member.domain.Career;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.domain.MemberStatusType;
import com.communet.malmoon.member.domain.MemberType;
import com.communet.malmoon.member.domain.Therapist;
import com.communet.malmoon.member.dto.request.CareerReq;
import com.communet.malmoon.member.dto.request.MemberJoinReq;
import com.communet.malmoon.member.dto.request.MemberMeChangeReq;
import com.communet.malmoon.member.dto.request.MemberPasswordChangeReq;
import com.communet.malmoon.member.dto.request.TherapistJoinReq;
import com.communet.malmoon.member.dto.response.CareerRes;
import com.communet.malmoon.member.dto.response.MemberMeRes;
import com.communet.malmoon.member.exception.DuplicateEmailException;
import com.communet.malmoon.member.repository.CareerRepository;
import com.communet.malmoon.member.repository.MemberRepository;
import com.communet.malmoon.member.repository.TherapistRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

	private final FileService fileService;
	private final MemberRepository memberRepository;
	private final TherapistRepository therapistRepository;
	private final CareerRepository careerRepository;
	private final PasswordEncoder passwordEncoder;

	/**
	 * 일반 회원 가입 처리
	 * 1. 이메일 중복 검사
	 * 2. 비밀번호 암호화
	 * 3. 회원 엔티티 생성 및 저장
	 * @param memberJoinReq 회원 가입 요청 DTO
	 * @throws DuplicateEmailException 이메일 중복 시 예외 발생
	 */
	@Transactional
	public void join(MemberJoinReq memberJoinReq) {
		if (checkEmail(memberJoinReq.getEmail())) {
			throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
		}
		Address address = Address.builder()
			.city(memberJoinReq.getCity())
			.district(memberJoinReq.getDistrict())
			.dong(memberJoinReq.getDong())
			.detail(memberJoinReq.getDetail())
			.build();

		Member member = Member.builder()
			.email(memberJoinReq.getEmail())
			.password(passwordEncoder.encode(memberJoinReq.getPassword()))
			.name(memberJoinReq.getName())
			.nickname(memberJoinReq.getNickname())
			.birthDate(memberJoinReq.getBirthDate())
			.tel1(memberJoinReq.getTel1())
			.tel2(memberJoinReq.getTel2())
			.role(MemberType.ROLE_CLIENT)
			.status(MemberStatusType.ACTIVE)
			.address(address)
			.profile(memberJoinReq.getProfile())
			.build();

		memberRepository.save(member);
	}

	/**
	 * 치료사 회원 가입 처리 (트랜잭션 적용)
	 * 1. 이메일 중복 검사
	 * 2. 비밀번호 암호화
	 * 3. 회원 엔티티 저장
	 * 4. 치료사 엔티티 생성 및 저장
	 * @param therapistJoinReq 치료사 가입 요청 DTO
	 * @throws DuplicateEmailException 이메일 중복 시 예외 발생
	 */
	@Transactional
	public void joinTherapist(TherapistJoinReq therapistJoinReq, MultipartFile qualification) {
		if (checkEmail(therapistJoinReq.getEmail())) {
			throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
		}

		Address address = Address.builder()
			.city(therapistJoinReq.getCity())
			.district(therapistJoinReq.getDistrict())
			.dong(therapistJoinReq.getDong())
			.detail(therapistJoinReq.getDetail())
			.build();

		Member member = Member.builder()
			.email(therapistJoinReq.getEmail())
			.password(passwordEncoder.encode(therapistJoinReq.getPassword()))
			.name(therapistJoinReq.getName())
			.nickname(therapistJoinReq.getNickname())
			.birthDate(therapistJoinReq.getBirthDate())
			.tel1(therapistJoinReq.getTel1())
			.tel2(therapistJoinReq.getTel2())
			.role(MemberType.ROLE_THERAPIST)
			.status(MemberStatusType.ACTIVE)
			.address(address)
			.profile(therapistJoinReq.getProfile())
			.build();

		memberRepository.save(member);

		FileUploadRes fileUploadRes = fileService.uploadFile(String.valueOf(FileType.QUALIFICATION), qualification);

		Therapist therapist = Therapist.builder()
			.therapistId(member.getMemberId())
			.careerYears(therapistJoinReq.getCareerYears())
			.fileId(fileUploadRes.getFileId())
			.member(member)
			.build();

		for (CareerReq careerDto : therapistJoinReq.getCareers()) {
			Career career = Career.builder()
				.company(careerDto.getCompany())
				.position(careerDto.getPosition())
				.startDate(careerDto.getStartDate())
				.endDate(careerDto.getEndDate())
				.build();
			therapist.addCareer(career);
		}

		therapistRepository.save(therapist);
	}

	/**
	 * 이메일 중복 체크
	 * @param email 체크할 이메일
	 * @return 이미 존재하면 true, 아니면 false
	 */
	public boolean checkEmail(String email) {
		return memberRepository.existsByEmail(email);
	}

	/**
	 * 회원 탈퇴 처리 (상태값 변경)
	 * @param member 탈퇴할 회원 엔티티
	 */
	@Transactional
	public void withdraw(Member member) {
		member.setStatus(MemberStatusType.WITHDRAWN);
	}

	/**
	 * 내 정보 조회
	 * - 일반 회원과 치료사 정보를 구분하여 반환
	 * @param member 현재 로그인한 회원
	 * @return 회원 상세 정보 응답 DTO
	 */
	@Transactional
	public MemberMeRes getMe(Member member) {
		if (member.getRole() == MemberType.ROLE_CLIENT) {
			return MemberMeRes.builder()
				.email(member.getEmail())
				.name(member.getName())
				.nickname(member.getNickname())
				.birthDate(member.getBirthDate())
				.tel1(member.getTel1())
				.tel2(member.getTel2())
				.city(member.getAddress().getCity())
				.district(member.getAddress().getDistrict())
				.dong(member.getAddress().getDong())
				.detail(member.getAddress().getDetail())
				.profile(member.getProfile())
				.build();
		}

		List<Career> careers = careerRepository.findByTherapist_TherapistId(member.getMemberId());
		List<CareerRes> careerResList = careers.stream()
			.map(c -> CareerRes.builder()
				.careerId(c.getCareerId())
				.company(c.getCompany())
				.position(c.getPosition())
				.startDate(c.getStartDate())
				.endDate((c.getEndDate()))
				.build())
			.toList();

		Optional<Therapist> therapist = therapistRepository.findById(member.getMemberId());
		String fileUrl = "";
		if (therapist.isPresent()) {
			fileUrl = fileService.getPresignedFileUrl(therapist.get().getFileId());
		}

		return MemberMeRes.builder()
			.email(member.getEmail())
			.name(member.getName())
			.nickname(member.getNickname())
			.birthDate(member.getBirthDate())
			.tel1(member.getTel1())
			.tel2(member.getTel2())
			.careerYears(therapist.get().getCareerYears())
			.careers(careerResList)
			.city(member.getAddress().getCity())
			.district(member.getAddress().getDistrict())
			.dong(member.getAddress().getDong())
			.detail(member.getAddress().getDetail())
			.profile(member.getProfile())
			.fileUrl(fileUrl)
			.build();
	}

	/**
	 * 내 정보 수정
	 * - 닉네임, 전화번호 등 변경 가능
	 * - 치료사 경력 추가 시 처리
	 * @param memberMeChangeReq 수정할 정보 DTO
	 * @param member 현재 로그인한 회원
	 * @throws IllegalArgumentException 일반 회원이 경력을 수정하려 할 경우 발생
	 */
	@Transactional
	public void changeMe(MemberMeChangeReq memberMeChangeReq, Member member) {
		if (memberMeChangeReq.getNickname() != null) {
			member.setNickname(memberMeChangeReq.getNickname());
		}
		if (memberMeChangeReq.getTel1() != null) {
			member.setTel1(memberMeChangeReq.getTel1());
		}
		if (memberMeChangeReq.getTel2() != null) {
			member.setTel2(memberMeChangeReq.getTel2());
		}
		if (memberMeChangeReq.getProfile() != null) {
			member.setProfile(memberMeChangeReq.getProfile());
		}
		if (memberMeChangeReq.getCity() != null) {
			member.getAddress().setCity(memberMeChangeReq.getCity());
		}
		if (memberMeChangeReq.getDistrict() != null) {
			member.getAddress().setDistrict(memberMeChangeReq.getDistrict());
		}
		if (memberMeChangeReq.getDong() != null) {
			member.getAddress().setDong(memberMeChangeReq.getDong());
		}
		if (memberMeChangeReq.getDetail() != null) {
			member.getAddress().setDetail(memberMeChangeReq.getDetail());
		}

		if (memberMeChangeReq.getCareerYears() != null || memberMeChangeReq.getCareers() != null) {
			Therapist therapist = therapistRepository.findById(member.getMemberId())
				.orElseThrow(() -> new IllegalArgumentException("일반 회원은 경력을 수정할 수 없습니다."));

			if (memberMeChangeReq.getCareerYears() != null) {
				therapist.setCareerYears(memberMeChangeReq.getCareerYears());
			}
			if (memberMeChangeReq.getCareers() != null) {
				careerRepository.deleteByTherapist_TherapistId(member.getMemberId());

				therapist.getCareers().clear();

				for (CareerReq careerReq : memberMeChangeReq.getCareers()) {
					Career career = Career.builder()
						.company(careerReq.getCompany())
						.position(careerReq.getPosition())
						.startDate(careerReq.getStartDate())
						.endDate(careerReq.getEndDate())
						.build();
					therapist.addCareer(career);
				}
			}
			therapistRepository.save(therapist);
		}
	}

	public void changePassword(MemberPasswordChangeReq req, Member member) {
		// 현재 비밀번호 확인
		if (!passwordEncoder.matches(req.getCurrentPassword(), member.getPassword())) {
			throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
		}

		// 같은 비밀번호로 변경 시도 방지
		if (passwordEncoder.matches(req.getNewPassword(), member.getPassword())) {
			throw new IllegalArgumentException("기존과 동일한 비밀번호로 변경할 수 없습니다.");
		}

		// 새 비밀번호 암호화 후 저장
		String encodedNewPassword = passwordEncoder.encode(req.getNewPassword());
		member.setPassword(encodedNewPassword);
		memberRepository.save(member);
	}

	public String getNicknameById(Long opponentId) {
		return memberRepository.findById(opponentId)
			.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."))
			.getNickname();
	}
}
