package com.communet.malmoon.aac.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.communet.malmoon.aac.domain.Aac;
import com.communet.malmoon.aac.domain.AacItemSet;
import com.communet.malmoon.aac.domain.AacSet;
import com.communet.malmoon.aac.dto.request.AacSetCreateReq;
import com.communet.malmoon.aac.dto.request.AacSetUpdateReq;
import com.communet.malmoon.aac.dto.response.AacSetCreateRes;
import com.communet.malmoon.aac.dto.response.AacSetDetailRes;
import com.communet.malmoon.aac.dto.response.AacSetSimpleRes;
import com.communet.malmoon.aac.repository.AacItemSetRepository;
import com.communet.malmoon.aac.repository.AacRepository;
import com.communet.malmoon.aac.repository.AacSetRepository;

@ExtendWith(MockitoExtension.class)
class AacSetServiceUnitTest {

	@InjectMocks
	AacSetService aacSetService;

	@Mock
	AacSetRepository aacSetRepository;
	@Mock
	AacItemSetRepository aacItemSetRepository;
	@Mock
	AacRepository aacRepository;

	@Test
	@DisplayName("AAC 묶음 생성 성공")
	void createAacSet_success() {
		// given
		AacSetCreateReq req = new AacSetCreateReq("감정 묶음", "기본 감정들", List.of(1L, 2L, 3L));
		Long therapistId = 1L;

		AacSet savedSet = AacSet.builder()
			.id(10L)
			.name("감정 묶음")
			.description("기본 감정들")
			.therapistId(therapistId)
			.createdAt(LocalDateTime.now())
			.build();

		given(aacSetRepository.save(any(AacSet.class))).willReturn(savedSet);

		// when
		AacSetCreateRes res = aacSetService.createAacSet(req, therapistId);

		// then
		assertThat(res).isNotNull();
		assertThat(res.getAacSetId()).isEqualTo(10L);
		verify(aacItemSetRepository, times(3)).save(any(AacItemSet.class));
	}

	@Test
	@DisplayName("내가 만든 AAC 묶음 목록 조회")
	void getMyAacSets_success() {
		// given
		Long therapistId = 1L;
		AacSet set = AacSet.builder()
			.id(1L)
			.name("묶음1")
			.description("설명")
			.therapistId(therapistId)
			.build();

		given(aacSetRepository.findAllByTherapistId(therapistId)).willReturn(List.of(set));

		// when
		List<AacSetSimpleRes> res = aacSetService.getMyAacSets(therapistId);

		// then
		assertThat(res).hasSize(1);
		assertThat(res.get(0).getId()).isEqualTo(1L);
	}

	@Test
	@DisplayName("특정 AAC 묶음 상세 조회 성공")
	void getAacInset_success() {
		// given
		Long aacSetId = 100L;
		Long therapistId = 1L;

		AacSet aacSet = AacSet.builder().id(aacSetId).therapistId(therapistId).build();
		AacItemSet mapping = AacItemSet.builder().aacItemId(200L).orderNo(1).build();
		Aac aac = Aac.builder().id(200L).name("슬픔").build();

		given(aacSetRepository.findById(aacSetId)).willReturn(Optional.of(aacSet));
		given(aacItemSetRepository.findByAacSetIdOrderByOrderNo(aacSetId)).willReturn(List.of(mapping));
		given(aacRepository.findById(200L)).willReturn(Optional.of(aac));

		// when
		List<AacSetDetailRes> res = aacSetService.getAacInset(aacSetId, therapistId);

		// then
		assertThat(res).hasSize(1);
		assertThat(res.get(0).getId()).isEqualTo(200L);
		assertThat(res.get(0).getOrderNo()).isEqualTo(1);
	}

	@Test
	@DisplayName("AAC 묶음 수정 성공")
	void updateAacSet_success() {
		// given
		Long setId = 10L;
		Long therapistId = 1L;
		AacSet set = AacSet.builder().id(setId).therapistId(therapistId).build();

		AacSetUpdateReq req = new AacSetUpdateReq("업데이트된 묶음", "변경된 설명", List.of(1L, 2L));

		given(aacSetRepository.findById(setId)).willReturn(Optional.of(set));

		// when
		aacSetService.updateAacSet(setId, req, therapistId);

		// then
		verify(aacItemSetRepository).deleteByAacSetId(setId);
		verify(aacItemSetRepository, times(2)).save(any(AacItemSet.class));
	}

	@Test
	@DisplayName("AAC 묶음 삭제 성공")
	void deleteAacSet_success() {
		// given
		Long setId = 10L;
		Long therapistId = 1L;
		AacSet set = AacSet.builder().id(setId).therapistId(therapistId).build();

		given(aacSetRepository.findById(setId)).willReturn(Optional.of(set));

		// when
		aacSetService.deleteAacSet(setId, therapistId);

		// then
		verify(aacItemSetRepository).deleteByAacSetId(setId);
		verify(aacSetRepository).delete(set);
	}
}
