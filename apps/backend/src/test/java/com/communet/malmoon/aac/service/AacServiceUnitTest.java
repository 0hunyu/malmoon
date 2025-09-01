package com.communet.malmoon.aac.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.communet.malmoon.aac.domain.Aac;
import com.communet.malmoon.aac.domain.AacStatus;
import com.communet.malmoon.aac.dto.request.AacConfirmReq;
import com.communet.malmoon.aac.dto.request.AacCreateReq;
import com.communet.malmoon.aac.dto.request.AacGetReq;
import com.communet.malmoon.aac.dto.response.AacGetRes;
import com.communet.malmoon.aac.repository.AacRepository;
import com.communet.malmoon.external.fastapi.FastApiClient;
import com.communet.malmoon.file.domain.FileType;
import com.communet.malmoon.file.dto.response.FileUploadRes;
import com.communet.malmoon.file.service.FileService;
import com.communet.malmoon.member.domain.Member;

@ExtendWith(MockitoExtension.class)
class AacServiceTest {

	@InjectMocks
	private AacService aacService;

	@Mock
	private FileService fileService;

	@Mock
	private AacRepository aacRepository;

	@Mock
	private FastApiClient fastApiClient;

	@Test
	@DisplayName("AAC 목록 전체 조회 성공 - 필터 조건 없이 페이징만 전달")
	void getAacList_success() {
		// given
		Aac mockAac = Aac.builder()
			.id(1L)
			.name("도와줘")
			.situation("긴급")
			.action("손들기")
			.emotion("불안")
			.description("도움을 요청하는 상황")
			.fileId(100L) // 실제 경로가 아닌 file 테이블의 Long ID
			.status(AacStatus.PUBLIC)
			.build();

		PageRequest pageRequest = PageRequest.of(0, 10);
		Page<Aac> page = new PageImpl<>(List.of(mockAac), pageRequest, 1);

		given(fileService.getFileUrl(100L)).willReturn("https://s3.amazonaws.com/bucket/image.png");
		given(aacRepository.findAll(any(Specification.class), any(Pageable.class)))
			.willReturn(page);
		;

		AacGetReq req = AacGetReq.builder()
			.page(0)
			.size(10)
			.build();

		// when
		Page<AacGetRes> result = aacService.getAacList(req, 1L);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getTotalElements()).isEqualTo(1);
		AacGetRes res = result.getContent().get(0);
		assertThat(res.getId()).isEqualTo(1L);
		assertThat(res.getName()).isEqualTo("도와줘");
		assertThat(res.getFileId()).isEqualTo("https://s3.amazonaws.com/bucket/image.png");
	}

	@Test
	@DisplayName("AAC 목록 필터 조건 조회 성공 - 상황, 감정 포함")
	void getAacList_withFilters_success() {
		// given
		Aac mockAac = Aac.builder()
			.id(2L)
			.name("화났어")
			.situation("놀림")
			.action("소리치기")
			.emotion("분노")
			.description("놀림을 당해 화가 난 상황")
			.fileId(101L)
			.status(AacStatus.PUBLIC)
			.build();

		PageRequest pageRequest = PageRequest.of(0, 10);
		Page<Aac> page = new PageImpl<>(List.of(mockAac), pageRequest, 1);

		given(fileService.getFileUrl(101L)).willReturn("https://s3.amazonaws.com/bucket/angry.png");
		given(aacRepository.findAll(any(Specification.class), any(Pageable.class)))
			.willReturn(page);

		AacGetReq req = AacGetReq.builder()
			.situation("놀림")
			.emotion("분노")
			.page(0)
			.size(10)
			.build();

		// when
		Page<AacGetRes> result = aacService.getAacList(req, 2L);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getTotalElements()).isEqualTo(1);
		AacGetRes res = result.getContent().get(0);
		assertThat(res.getId()).isEqualTo(2L);
		assertThat(res.getName()).isEqualTo("화났어");
		assertThat(res.getFileId()).isEqualTo("https://s3.amazonaws.com/bucket/angry.png");
	}

	@Test
	@DisplayName("AAC 상세 조회 성공 - 존재하는 ID")
	void getAacDetail_success() {
		// given
		Aac mockAac = Aac.builder()
			.id(1L)
			.name("슬픔")
			.situation("실패")
			.action("울기")
			.emotion("우울")
			.description("시험에 떨어졌을 때")
			.fileId(100L)
			.status(AacStatus.PUBLIC)
			.build();

		given(aacRepository.findById(1L)).willReturn(Optional.of(mockAac));
		given(fileService.getFileUrl(100L)).willReturn("https://s3.amazonaws.com/bucket/slump.png");

		// when
		AacGetRes result = aacService.getAacDetail(1L);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(1L);
		assertThat(result.getName()).isEqualTo("슬픔");
		assertThat(result.getFileId()).isEqualTo("https://s3.amazonaws.com/bucket/slump.png");
	}

	@Test
	@DisplayName("AAC 이미지 생성 요청 성공 - FastAPI 연동")
	void requestPreviewFromFastApi_success() {
		// given
		AacCreateReq req = new AacCreateReq("학교", "공부", "신남", "이유");

		String expectedUrl = "https://fastapi.com/preview/school.png";
		given(fastApiClient.requestPreviewImage(req)).willReturn(expectedUrl);

		// when
		String result = aacService.requestPreviewFromFastApi(req);

		// then
		assertThat(result).isEqualTo(expectedUrl);
	}

	@Test
	@DisplayName("AAC 생성 확정 성공 - 파일 저장 및 AAC 저장")
	void confirmAndSaveAac_success() throws IOException {
		// given
		String tempFileName = "test-image.jpg";
		Path tempFilePath = Paths.get("apps/AI/static/temp", tempFileName);
		java.io.File tempFile = tempFilePath.toFile();

		// 테스트용 더미 임시 파일 생성
		if (!tempFile.getParentFile().exists()) {
			tempFile.getParentFile().mkdirs();
		}
		tempFile.createNewFile();

		AacConfirmReq req = AacConfirmReq.builder()
			.name("기쁨")
			.description("기쁜 상황")
			.situation("생일")
			.action("웃기")
			.emotion("행복")
			.reason("선물")
			.imagePath(tempFilePath.toString())
			.status(AacStatus.PRIVATE)
			.build();

		Long memberId = 10L;

		FileUploadRes dummyUploadRes = FileUploadRes.builder()
			.fileId(123L)
			.url("https://s3.amazonaws.com/bucket/test-image.jpg")
			.build();

		given(fileService.uploadFile(eq(String.valueOf(FileType.AAC)), any(File.class)))
			.willReturn(dummyUploadRes);

		// when
		aacService.confirmAndSaveAac(req, memberId);

		// then
		verify(fileService).uploadFile(eq("AAC"), any(File.class));
		verify(aacRepository).save(any(Aac.class));

		// 정리
		if (tempFile.exists()) {
			tempFile.delete(); // 테스트 후 파일 제거
		}
	}

	@Test
	@DisplayName("사용자 정의 AAC 삭제 성공 - soft delete 처리")
	void softDeleteCustomAac_success() {
		// given
		Long aacId = 5L;
		Long memberId = 10L;
		Member member = Member.builder().memberId(memberId).build();

		Aac aac = Aac.builder()
			.id(aacId)
			.therapistId(memberId)
			.status(AacStatus.PRIVATE)
			.build();

		given(aacRepository.findById(aacId)).willReturn(Optional.of(aac));

		// when
		aacService.softDeleteCustomAac(aacId, memberId);

		// then
		assertThat(aac.getStatus()).isEqualTo(AacStatus.DELETED);
		verify(aacRepository).save(aac);
	}

}
