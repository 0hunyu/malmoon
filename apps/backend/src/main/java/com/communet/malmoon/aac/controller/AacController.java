package com.communet.malmoon.aac.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.communet.malmoon.aac.dto.request.AacCompleteReq;
import com.communet.malmoon.aac.dto.request.AacConfirmReq;
import com.communet.malmoon.aac.dto.request.AacCreateReq;
import com.communet.malmoon.aac.dto.request.AacCustomPresignReq;
import com.communet.malmoon.aac.dto.request.AacCustomReq;
import com.communet.malmoon.aac.dto.request.AacGetReq;
import com.communet.malmoon.aac.dto.response.AacCreateRes;
import com.communet.malmoon.aac.dto.response.AacGetRes;
import com.communet.malmoon.aac.service.AacService;
import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.file.domain.FileType;
import com.communet.malmoon.file.dto.request.PresignPutReq;
import com.communet.malmoon.file.dto.request.UploadConfirmReq;
import com.communet.malmoon.file.dto.response.PresignPutRes;
import com.communet.malmoon.file.dto.response.UploadConfirmRes;
import com.communet.malmoon.file.service.FileService;
import com.communet.malmoon.member.domain.Member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AAC 관련 API 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/v1/aacs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AAC", description = "AAC 이모지 관련 API")
public class AacController {

	private final AacService aacService;
	private final FileService fileService;

	/**
	 * 로그인한 사용자만 접근 가능한 AAC 목록 조회 API입니다.
	 * DEFAULT, PUBLIC 상태의 항목만 반환합니다.
	 *
	 * @param req 상황, 감정 등 필터와 페이지 정보
	 * @return 필터 조건에 따른 AAC 목록
	 */
	//@PreAuthorize("isAuthenticated()")
	@Operation(summary = "AAC 검색 및 목록 조회", description = "상황, 감정, 동작 조건을 전달하면 해당 조건에 맞는 AAC 이모지를 검색합니다. 조건이 없으면 전체 목록을 반환합니다.")
	@GetMapping
	public ResponseEntity<Page<AacGetRes>> getAacList(
		@Parameter(description = "AAC 필터 조건 및 페이징 정보") @ModelAttribute AacGetReq req, @CurrentMember Member member) {
		Page<AacGetRes> result = aacService.getAacList(req, member.getMemberId());
		return ResponseEntity.ok(result);
	}

	/**
	 * 사용자가 직접 AAC를 등록하는 API입니다.
	 * 이미지와 함께 상황, 감정, 동작 등의 메타데이터를 업로드합니다.
	 *
	 * @param request 사용자 정의 AAC 등록 요청 (multipart/form-data)
	 * @param member  현재 로그인한 사용자 정보
	 * @return 등록 성공 여부
	 */
	@PostMapping("/custom")
	@Operation(summary = "사용자 정의 AAC 등록", description = "사용자가 직접 AAC 이모지를 생성하여 등록합니다. 이미지와 메타 정보를 포함합니다.")
	public ResponseEntity<Void> uploadCustomAac(@ModelAttribute AacCustomReq request, @CurrentMember Member member) {
		aacService.uploadCustomAac(request, member.getMemberId());
		return ResponseEntity.ok().build();
	}

	/**
	 * AAC 이미지 생성 (FastAPI 연동)
	 *
	 * @param request 상황/감정/동작 등 생성 요청 데이터
	 * @return 생성된 이미지 preview URL
	 */
	@PostMapping("/generate")
	@Operation(summary = "AAC 이모지 생성", description = "상황, 감정, 동작을 기반으로 AAC 이미지 생성을 요청합니다.")
	public ResponseEntity<AacCreateRes> generateAacImage(@RequestBody AacCreateReq request) {
		String previewUrl = aacService.requestPreviewFromFastApi(request);
		AacCreateRes response = AacCreateRes.of(previewUrl);
		return ResponseEntity.ok(response);
	}

	/**
	 * FastAPI에서 생성된 임시 AAC 이미지를 확정하고 S3에 저장한 후, DB에 AAC 정보를 등록합니다.
	 *
	 * @param request 확정할 AAC 정보 요청 객체 (이름, 설명, 감정, 상황, 동작, 이유 등 포함)
	 * @param member 현재 로그인한 사용자 정보 (커스텀 인증 객체에서 주입됨)
	 * @return 저장 성공 시 HTTP 200 OK 응답 반환
	 *
	 * @see com.communet.malmoon.aac.dto.request.AacConfirmReq
	 * @see com.communet.malmoon.aac.dto.response.AacCreateRes
	 */
	@PostMapping("/confirm")
	@Operation(summary = "AAC 생성 확정", description = "FastAPI에서 생성된 임시 이미지를 S3에 저장하고 AAC로 확정합니다.")
	public ResponseEntity<AacCreateRes> confirmAacImage(
		@RequestBody AacConfirmReq request,
		@CurrentMember Member member) {

		aacService.confirmAndSaveAac(request, member.getMemberId());

		return ResponseEntity.ok().build();
	}

	/**
	 * AAC 상세 정보를 조회합니다.
	 *
	 * @param aacId 조회할 AAC ID
	 * @return AAC 상세 응답
	 */
	@GetMapping("/{aacId}")
	@Operation(summary = "AAC 상세 조회", description = "특정 AAC 이모지의 상세 정보를 조회합니다.")
	public ResponseEntity<AacGetRes> getAacDetail(@PathVariable("aacId") Long aacId) {
		AacGetRes result = aacService.getAacDetail(aacId);
		return ResponseEntity.ok(result);
	}

	/**
	 * 사용자가 생성한 AAC 중 상태가 PRIVATE인 항목만 삭제할 수 있습니다.
	 *
	 * @param aacId 삭제할 AAC ID
	 * @param member 현재 로그인한 사용자 정보
	 * @return 삭제 성공 시 HTTP 200 OK
	 */
	@PatchMapping("/custom/{aacId}")
	@Operation(summary = "사용자 정의 AAC 삭제", description = "사용자가 생성하고 상태가 PRIVATE인 AAC만 삭제할 수 있습니다.")
	public ResponseEntity<Void> softDeleteCustomAac(
		@PathVariable("aacId") Long aacId,
		@CurrentMember Member member
	) {
		aacService.softDeleteCustomAac(aacId, member.getMemberId());
		return ResponseEntity.ok().build();
	}

	@PostMapping("/presign-upload")
	public ResponseEntity<PresignPutRes> init(@RequestBody @Valid PresignPutReq req,
		@CurrentMember Member me) {
		req.setFileType(FileType.AAC);
		PresignPutRes presign = fileService.presignPut(req, me.getMemberId());
		return ResponseEntity.ok(presign);
	}

	@PostMapping("/presign-complete")
	public ResponseEntity<AacCreateRes> complete(@RequestBody @Valid AacCompleteReq req,
		@CurrentMember Member me) {
		// 1) 파일 확정(HEAD 검증 + File 저장)
		UploadConfirmReq ureq = UploadConfirmReq.builder()
			.key(req.getKey())
			.contentType(req.getContentType())
			.size(req.getSize())
			.etag(req.getEtag())
			.build();

		UploadConfirmRes confirmed = fileService.confirmUpload(ureq, me.getMemberId());

		// 2) Aac 생성 (FileId 사용)
		AacCustomPresignReq aacCustomReq = new AacCustomPresignReq();
		aacCustomReq.setName(req.getName());
		aacCustomReq.setSituation(req.getSituation());
		aacCustomReq.setAction(req.getAction());
		aacCustomReq.setEmotion(req.getEmotion());
		aacCustomReq.setDescription(req.getDescription());
		aacCustomReq.setStatus(req.getStatus());
		aacCustomReq.setFileId(confirmed.getFileId());

		aacService.createFromFileId(aacCustomReq, me.getMemberId());

		return ResponseEntity.ok(AacCreateRes.of(confirmed.getViewUrl()));
	}

}
