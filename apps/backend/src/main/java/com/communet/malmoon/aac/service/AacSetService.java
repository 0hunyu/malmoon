package com.communet.malmoon.aac.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.communet.malmoon.aac.domain.Aac;
import com.communet.malmoon.aac.domain.AacItemSet;
import com.communet.malmoon.aac.domain.AacSet;
import com.communet.malmoon.aac.dto.request.AacSetCreateReq;
import com.communet.malmoon.aac.dto.request.AacSetUpdateReq;
import com.communet.malmoon.aac.dto.response.AacSetCreateRes;
import com.communet.malmoon.aac.dto.response.AacSetDetailRes;
import com.communet.malmoon.aac.dto.response.AacSetSimpleRes;
import com.communet.malmoon.aac.exception.AacErrorCode;
import com.communet.malmoon.aac.exception.AacException;
import com.communet.malmoon.aac.repository.AacItemSetRepository;
import com.communet.malmoon.aac.repository.AacRepository;
import com.communet.malmoon.aac.repository.AacSetRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * AAC 묶음 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
public class AacSetService {

	private final AacRepository aacRepository;
	private final AacSetRepository aacSetRepository;
	private final AacItemSetRepository aacItemSetRepository;

	/**
	 * AAC 묶음을 생성하고, 선택된 AAC 항목들을 묶음에 연결합니다.
	 *
	 * @param request 묶음 이름, 설명, 포함할 AAC ID 리스트
	 * @param therapistId 현재 로그인한 재활사 ID
	 * @return 생성된 AAC 묶음 ID를 포함한 응답 DTO
	 */
	@Transactional
	public AacSetCreateRes createAacSet(AacSetCreateReq request, Long therapistId) {
		if (request.getAacItemIds() == null || request.getAacItemIds().isEmpty()) {
			throw new AacException(AacErrorCode.REQUEST_AAC_ITEM_NOT_FOUND);
		}

		Set<Long> uniqueIds = new HashSet<>(request.getAacItemIds());
		if (uniqueIds.size() != request.getAacItemIds().size()) {
			throw new AacException(AacErrorCode.DUPLICATED_ITEM_IN_SET);
		}

		// 1. AAC Set 생성
		AacSet aacSet = aacSetRepository.save(AacSet.builder()
			.name(request.getName())
			.description(request.getDescription())
			.therapistId(therapistId)
			.createdAt(LocalDateTime.now())
			.build());

		// 2. AAC Item Set 연결 저장
		int order = 1;
		for (Long itemId : request.getAacItemIds()) {
			aacItemSetRepository.save(AacItemSet.builder()
				.aacItemId(itemId)
				.aacSetId(aacSet.getId())
				.orderNo(order++)
				.addedAt(LocalDateTime.now())
				.build());
		}

		return AacSetCreateRes.of(aacSet.getId());
	}

	/**
	 * 로그인한 치료사가 생성한 모든 AAC 묶음을 목록 형태로 조회합니다.
	 *
	 * @param therapistId 현재 로그인한 치료사 ID
	 * @return 치료사가 생성한 AAC 묶음 리스트
	 */
	@Transactional
	public List<AacSetSimpleRes> getMyAacSets(Long therapistId) {
		List<AacSet> sets = aacSetRepository.findAllByTherapistId(therapistId);
		return sets.stream()
			.map(AacSetSimpleRes::from)
			.toList();
	}

	/**
	 * 특정 AAC 묶음에 포함된 AAC 항목들을 상세 조회합니다.
	 *
	 * @param aacSetId 조회할 AAC 묶음 ID
	 * @param therapistId 로그인한 치료사 ID
	 * @return AAC 항목 상세 리스트 (순서 포함)
	 */
	@Transactional
	public List<AacSetDetailRes> getAacInset(Long aacSetId, Long therapistId) {
		// 소유권 체크
		AacSet set = aacSetRepository.findById(aacSetId)
			.orElseThrow(() -> new AacException(AacErrorCode.NOT_FOUND));

		if (!set.getTherapistId().equals(therapistId)) {
			throw new AacException(AacErrorCode.UNAUTHORIZED_ACCESS);
		}

		// AAC 항목 조회
		List<AacItemSet> mappings = aacItemSetRepository.findByAacSetIdOrderByOrderNo(aacSetId);

		return mappings.stream()
			.map(mapping -> {
				Aac item = aacRepository.findById(mapping.getAacItemId())
					.orElseThrow(() -> new AacException(AacErrorCode.AAC_ITEM_NOT_FOUND));
				return AacSetDetailRes.from(item, mapping.getOrderNo());
			})
			.toList();
	}

	/**
	 * AAC 묶음을 수정합니다. 이름, 설명, 포함된 항목 리스트를 모두 갱신합니다.
	 *
	 * @param aacSetId 수정할 AAC 묶음 ID
	 * @param request 요청 DTO (이름, 설명, 항목 리스트)
	 * @param therapistId 현재 사용자 ID
	 */
	@Transactional
	public void updateAacSet(Long aacSetId, AacSetUpdateReq request, Long therapistId) {
		AacSet set = aacSetRepository.findById(aacSetId)
			.orElseThrow(() -> new AacException(AacErrorCode.NOT_FOUND));

		if (!set.getTherapistId().equals(therapistId)) {
			throw new AacException(AacErrorCode.UNAUTHORIZED_ACCESS);
		}

		set.update(request.getName(), request.getDescription());

		aacItemSetRepository.deleteByAacSetId(aacSetId);

		int order = 1;
		for (Long itemId : request.getAacItemIds()) {
			aacItemSetRepository.save(AacItemSet.builder()
				.aacSetId(aacSetId)
				.aacItemId(itemId)
				.orderNo(order++)
				.addedAt(LocalDateTime.now())
				.build());
		}
	}

	/**
	 * AAC 묶음을 삭제합니다. 연결된 항목도 모두 삭제됩니다.
	 *
	 * @param aacSetId 삭제할 묶음 ID
	 * @param therapistId 현재 사용자 ID
	 */
	@Transactional
	public void deleteAacSet(Long aacSetId, Long therapistId) {
		AacSet set = aacSetRepository.findById(aacSetId)
			.orElseThrow(() -> new AacException(AacErrorCode.NOT_FOUND));

		if (!set.getTherapistId().equals(therapistId)) {
			throw new AacException(AacErrorCode.UNAUTHORIZED_ACCESS);
		}

		aacItemSetRepository.deleteByAacSetId(aacSetId);
		aacSetRepository.delete(set);
	}
}
