package com.communet.malmoon.aac.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.communet.malmoon.aac.dto.request.AacSetCreateReq;
import com.communet.malmoon.aac.dto.request.AacSetUpdateReq;
import com.communet.malmoon.aac.dto.response.AacSetCreateRes;
import com.communet.malmoon.aac.dto.response.AacSetDetailRes;
import com.communet.malmoon.aac.dto.response.AacSetSimpleRes;
import com.communet.malmoon.aac.service.AacSetService;
import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.member.domain.Member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AAC 묶음 관련 API 컨트롤러
 * 사용자가 생성한 AAC 카드 묶음을 생성하고, 조회, 수정, 삭제 할 수 있는 기능을 제공합니다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/aacs/sets")
@Slf4j
@Tag(name = "AAC 묶음", description = "AAC 카드 묶음 CRUD API")
public class AacSetController {

	private final AacSetService aacSetService;

	/**
	 * 기존에 등록된 AAC 항목들을 선택하여 하나의 묶음으로 저장합니다.
	 *
	 * @param request AAC 묶음 생성 요청 (묶음 이름, 설명, 포함할 AAC ID 리스트)
	 * @param member 현재 로그인한 사용자 (재활사)
	 * @return 생성된 AAC 묶음 ID 응답
	 */
	@PostMapping("/create")
	@Operation(summary = "AAC 묶음 생성", description = "기존 AAC 항목들을 선택하여 하나의 AAC 묶음을 생성합니다.")
	public ResponseEntity<AacSetCreateRes> createAacSet(
		@RequestBody AacSetCreateReq request,
		@CurrentMember Member member
	) {
		AacSetCreateRes res = aacSetService.createAacSet(request, member.getMemberId());
		return ResponseEntity.ok(res);
	}

	/**
	 * 로그인한 재활사가 생성한 AAC 묶음 목록을 조회합니다.
	 *
	 * @param member 현재 로그인한 사용자
	 * @return AAC 묶음 목록
	 */
	@GetMapping("/my")
	@Operation(summary = "내 AAC 묶음 목록 조회", description = "로그인한 재활사가 생성한 AAC 묶음 목록을 반환합니다.")
	public ResponseEntity<List<AacSetSimpleRes>> getMyAacSets(@CurrentMember Member member) {
		List<AacSetSimpleRes> result = aacSetService.getMyAacSets(member.getMemberId());
		return ResponseEntity.ok(result);
	}

	/**
	 * 특정 AAC 묶음에 포함된 AAC 항목들을 상세 조회합니다.
	 * 항목들은 저장 당시의 순서를 기준으로 정렬되어 반환됩니다.
	 *
	 * @param aacSetId 조회할 AAC 묶음 ID
	 * @param member 현재 로그인한 사용자
	 * @return AAC 묶음에 포함된 항목 목록 (정렬 순서 포함)
	 */
	@GetMapping("/my/{aacSetId}")
	@Operation(summary = "AAC 묶음 상세 조회", description = "묶음에 포함된 AAC 항목들을 순서대로 반환합니다.")
	public ResponseEntity<List<AacSetDetailRes>> getAacItemsInSet(
		@PathVariable("aacSetId") Long aacSetId,
		@CurrentMember Member member
	) {
		List<AacSetDetailRes> result = aacSetService.getAacInset(aacSetId, member.getMemberId());
		return ResponseEntity.ok(result);
	}

	/**
	 * 기존에 저장된 AAC 묶음을 수정합니다.
	 * 이름, 설명, 포함된 AAC 항목 리스트를 모두 갱신하며,
	 * 기존에 연결된 항목 정보는 삭제되고 새롭게 재등록됩니다.
	 *
	 * @param aacSetId 수정할 AAC 묶음 ID
	 * @param request 수정 요청 DTO (이름, 설명, 항목 리스트 포함)
	 * @param member 현재 로그인한 사용자 (재활사)
	 * @return 성공 시 200 OK
	 */
	@PatchMapping("/{aacSetId}")
	@Operation(summary = "AAC 묶음 수정", description = "묶음 이름, 설명, 포함된 AAC 항목을 수정합니다.")
	public ResponseEntity<Void> updateAacSet(@PathVariable("aacSetId") Long aacSetId,
		@RequestBody AacSetUpdateReq request,
		@CurrentMember Member member) {
		aacSetService.updateAacSet(aacSetId, request, member.getMemberId());
		return ResponseEntity.ok().build();
	}

	/**
	 * 특정 AAC 묶음을 삭제합니다.
	 * 삭제 시 해당 묶음에 연결된 항목 정보도 함께 제거됩니다.
	 *
	 * @param aacSetId 삭제할 AAC 묶음 ID
	 * @param member 현재 로그인한 사용자 (재활사)
	 * @return 성공 시 204 No Content
	 */
	@DeleteMapping("/{aacSetId}")
	@Operation(summary = "AAC 묶음 삭제", description = "AAC 묶음을 삭제합니다.")
	public ResponseEntity<Void> deleteAacSet(
		@PathVariable("aacSetId") Long aacSetId,
		@CurrentMember Member member
	) {
		aacSetService.deleteAacSet(aacSetId, member.getMemberId());
		return ResponseEntity.noContent().build();
	}
}
