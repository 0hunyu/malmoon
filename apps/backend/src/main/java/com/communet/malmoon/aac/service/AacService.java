package com.communet.malmoon.aac.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.communet.malmoon.aac.domain.Aac;
import com.communet.malmoon.aac.dto.request.AacConfirmReq;
import com.communet.malmoon.aac.dto.request.AacCreateReq;
import com.communet.malmoon.aac.dto.request.AacCustomPresignReq;
import com.communet.malmoon.aac.dto.request.AacCustomReq;
import com.communet.malmoon.aac.dto.request.AacGetReq;
import com.communet.malmoon.aac.dto.response.AacCreateRes;
import com.communet.malmoon.aac.dto.response.AacGetRes;
import com.communet.malmoon.aac.exception.AacErrorCode;
import com.communet.malmoon.aac.exception.AacException;
import com.communet.malmoon.aac.repository.AacRepository;
import com.communet.malmoon.aac.repository.AacSpecification;
import com.communet.malmoon.external.fastapi.FastApiClient;
import com.communet.malmoon.file.domain.File;
import com.communet.malmoon.file.domain.FileType;
import com.communet.malmoon.file.dto.response.FileUploadRes;
import com.communet.malmoon.file.repository.FileRepository;
import com.communet.malmoon.file.service.FileService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AAC 관련 비즈니스 로직을 처리하는 서비스입니다.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AacService {

	private final AacRepository aacRepository;
	private final FileService fileService;
	private final FileRepository fileRepository;
	private final FastApiClient fastApiClient;

	/**
	 * 필터 조건과 페이징 정보를 기반으로 DEFAULT 또는 PUBLIC 상태의 AAC 항목을 조회합니다.
	 * 각 항목에는 S3 이미지 URL이 포함되어 반환됩니다.
	 *
	 * @param req 필터 조건 (situation, action, emotion) 및 페이지 정보
	 * @return 조건에 맞는 AAC 항목 페이지 (이미지 URL 포함)
	 */
	public Page<AacGetRes> getAacList(AacGetReq req, Long therapistId) {
		Pageable pageable = PageRequest.of(req.getPage(), req.getSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
		// 동적 필터 조건 구성
		var spec = AacSpecification.withFilters(req.getSituation(), req.getAction(), req.getEmotion(), therapistId);

		// Specification 기반 조회
		Page<Aac> page = aacRepository.findAll(spec, pageable);

		// 파일 URL 포함하여 응답 객체로 변환
		return page.map(aac -> {
			try {
				String imageUrl = fileService.getPresignedFileUrl(aac.getFileId());
				return AacGetRes.from(aac, imageUrl);
			} catch (Exception e) {
				throw new AacException(AacErrorCode.NOT_FOUND);
			}
		});
	}

	/**
	 * 사용자가 직접 AAC 이모지를 업로드하여 등록합니다.
	 * 전달받은 이미지 파일을 S3에 업로드하고, 관련 메타데이터(상황, 감정, 동작 등)를 포함한 AAC 엔티티를 저장합니다.
	 *
	 * @param request 사용자 정의 AAC 등록 요청 데이터 (이름, 설명, 상황, 감정, 동작, 이유, 이미지 등)
	 * @param memberId 현재 로그인한 사용자의 ID
	 */
	@Transactional
	public void uploadCustomAac(AacCustomReq request, Long memberId) {
		try {
			if (request.getFile() == null || request.getFile().isEmpty()) {
				throw new AacException(AacErrorCode.FILE_NOT_FOUND);
			}
			String directory = String.valueOf(FileType.AAC);
			FileUploadRes fileUploadRes = fileService.uploadFile(directory, request.getFile());

			Aac aac = Aac.builder()
				.name(request.getName())
				.situation(request.getSituation())
				.action(request.getAction())
				.emotion(request.getEmotion())
				.description(request.getDescription())
				.fileId(fileUploadRes.getFileId())
				.therapistId(memberId)
				.status(request.getStatus())
				.build();

			aacRepository.save(aac);
		} catch (AacException e) {
			log.warn("사용자 정의 AAC 등록 실패 - 사용자 요청 오류: {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("사용자 정의 AAC 등록 중 서버 오류 발생", e);
			throw new AacException(AacErrorCode.UNEXPECTED_SERVER_ERROR);
		}
	}

	/**
	 * FastAPI를 통해 이미지 프리뷰 생성 요청을 수행합니다.
	 *
	 * @param request AAC 생성 요청 데이터
	 * @return 생성된 이미지 preview URL
	 */
	public String requestPreviewFromFastApi(AacCreateReq request) {
		return fastApiClient.requestPreviewImage(request);
	}

	/**
	 * FastAPI에서 생성된 임시 이미지를 확정 처리하여 S3에 업로드하고, AAC 정보를 DB에 저장합니다.
	 *
	 * @param request 확정할 AAC 정보 요청 객체 (이름, 설명, 상황, 감정, 동작, 이미지 경로 등 포함)
	 * @param memberId 현재 로그인한 사용자 ID (재활사 기준)
	 * @throws AacException 예외 발생 시 커스텀 예외 반환
	 */
	@Transactional
	public void confirmAndSaveAac(AacConfirmReq request, Long memberId) {
		// 1. 파일 경로 재구성
		String filename = Path.of(request.getImagePath()).getFileName().toString(); // abc123.png
		Path tempImagePath = Paths.get("apps/AI/static/temp", filename).normalize();
		System.out.println(tempImagePath);

		if (!Files.exists(tempImagePath)) {
			throw new AacException(AacErrorCode.TEMP_IMAGE_NOT_FOUND);
		}

		String directory = String.valueOf(FileType.AAC);

		// 2. S3 업로드
		FileUploadRes fileUploadRes;
		try {
			fileUploadRes = fileService.uploadFile(directory, tempImagePath.toFile());
		} catch (Exception e) {
			log.error("📁 파일 업로드 및 저장 실패", e);
			throw new AacException(AacErrorCode.FILE_UPLOAD_FAILED);
		}

		// 3. 임시 이미지 삭제
		try {
			Files.delete(tempImagePath);
		} catch (IOException e) {
			log.warn("❗ 임시 이미지 삭제 실패: {}", tempImagePath, e);
			throw new AacException(AacErrorCode.TEMP_IMAGE_DELETE_FAILED);
		}

		memberId = 1L;
		try {
			aacRepository.save(Aac.builder()
				.name(request.getName())
				.situation(request.getSituation())
				.action(request.getAction())
				.emotion(request.getEmotion())
				.description(request.getDescription())
				.fileId(fileUploadRes.getFileId())
				.therapistId(memberId)
				.status(request.getStatus())
				.build());

			//System.out.println(fileUploadRes.getFileId());
		} catch (Exception e) {
			log.error("🧩 AAC 저장 실패", e);
			throw new AacException(AacErrorCode.AAC_SAVE_FAILED);
		}
	}

	@Transactional
	public AacGetRes getAacDetail(Long aacId) {
		Aac aac = aacRepository.findById(aacId)
			.orElseThrow(() -> new AacException(AacErrorCode.NOT_FOUND));

		String ImageUrl = fileService.getPresignedFileUrl(aac.getFileId());

		return AacGetRes.from(aac, ImageUrl);
	}

	/**
	 * 사용자가 생성한 PRIVATE 상태의 AAC를 삭제합니다.
	 *
	 * @param aacId AAC ID
	 * @param memberId 로그인한 사용자 ID
	 */
	@Transactional
	public void softDeleteCustomAac(Long aacId, Long memberId) {
		Aac aac = aacRepository.findById(aacId)
			.orElseThrow(() -> new AacException(AacErrorCode.NOT_FOUND));

		if (!aac.getTherapistId().equals(memberId)) {
			throw new AacException(AacErrorCode.UNAUTHORIZED_ACCESS);
		}

		if (!aac.getStatus().isPrivate()) {
			throw new AacException(AacErrorCode.INVALID_STATUS);
		}

		try {
			aac.changeStatusDeleted();
			aacRepository.save(aac);
		} catch (Exception e) {
			log.error("AAC 삭제 실패 - aacId: {}", aacId, e);
			throw new AacException(AacErrorCode.AAC_DELETE_FAILED);
		}
	}

	@Transactional
	public AacCreateRes createFromFileId(AacCustomPresignReq request, Long therapistId) {
		// 1) 파일 존재/상태 검증
		File file = fileRepository.findById(request.getFileId())
			.orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다. id=" + request.getFileId()));
		if (file.isDeleted()) {
			throw new IllegalStateException("삭제된 파일은 사용할 수 없습니다. id=" + request.getFileId());
		}
		if (file.getFileType() != FileType.AAC) {
			// AAC만 허용(정책에 따라 완화 가능)
			throw new IllegalArgumentException("AAC 파일만 허용됩니다. 실제 타입=" + file.getFileType());
		}

		// 2) AAC 저장
		Aac aac = Aac.builder()
			.name(request.getName())
			.situation(request.getSituation())
			.action(request.getAction())
			.emotion(request.getEmotion())
			.description(request.getDescription())
			.fileId(request.getFileId())
			.therapistId(therapistId)
			.status(request.getStatus())
			.build();

		Aac saved = aacRepository.save(aac);

		// 3) (선택) 미리보기 URL(짧은 pre-signed GET) 생성
		String previewUrl = fileService.getPresignedFileUrl(request.getFileId());

		// 현재 AacCreateRes가 previewUrl만 담고 있다면:
		return AacCreateRes.of(previewUrl);
	}
}
