package com.communet.malmoon.filter.service;

import com.communet.malmoon.filter.domain.Filter;
import com.communet.malmoon.filter.domain.FilterSet;
import com.communet.malmoon.filter.domain.FilterSetInfo;
import com.communet.malmoon.filter.dto.request.FilterSetCreateReq;
import com.communet.malmoon.filter.dto.request.FilterSetUpdateReq;
import com.communet.malmoon.filter.dto.response.FilterSetCreateRes;
import com.communet.malmoon.filter.dto.response.FilterSetDetailRes;
import com.communet.malmoon.filter.dto.response.FilterSetSimpleRes;
import com.communet.malmoon.filter.exception.FilterErrorCode;
import com.communet.malmoon.filter.exception.FilterException;
import com.communet.malmoon.filter.repository.FilterRepository;
import com.communet.malmoon.filter.repository.FilterSetInfoRepository;
import com.communet.malmoon.filter.repository.FilterSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FilterSetService {

    private final FilterRepository filterRepository;
    private final FilterSetRepository filterSetRepository;
    private final FilterSetInfoRepository filterSetInfoRepository;

    /**
     * 필터 묶음을 생성하고, 선택된 필터들을 묶음에 연결합니다.
     *
     * @param request 묶음 이름, 설명, 포함할 필터 ID 리스트
     * @param memberId 현재 로그인한 사용자 ID
     * @return 생성된 필터 묶음 ID
     */
    @Transactional
    public FilterSetCreateRes createFilterSet(FilterSetCreateReq request, Long memberId) {
        if (request.getFilterIds() == null || request.getFilterIds().isEmpty()) {
            throw new FilterException(FilterErrorCode.REQUEST_FILTER_NOT_FOUND);
        }

        Set<Long> uniqueIds = new HashSet<>(request.getFilterIds());
        if (uniqueIds.size() != request.getFilterIds().size()) {
            throw new FilterException(FilterErrorCode.DUPLICATED_FILTER_IN_SET);
        }

        // 1. FilterSet 생성
        FilterSet filterSet = filterSetRepository.save(
                FilterSet.builder()
                        .name(request.getName())
                        .description(request.getDescription())
                        .therapistId(memberId)
                        .build()
        );

        // 2. FilterSetInfo 저장
        for (Long filterId : request.getFilterIds()) {
            Filter filter = filterRepository.findById(filterId)
                    .orElseThrow(() -> new FilterException(FilterErrorCode.FILTER_NOT_FOUND));

            filterSetInfoRepository.save(FilterSetInfo.builder()
                    .filterSet(filterSet)
                    .filter(filter)
                    .build());
        }

        return FilterSetCreateRes.builder().filterSetId(filterSet.getFilterSetId()).build();
    }

    /**
     * 로그인한 사용자가 만든 필터 묶음 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FilterSetSimpleRes> getMyFilterSets(Long memberId) {
        List<FilterSet> sets = filterSetRepository.findAllByTherapistId(memberId);
        return sets.stream()
                .map(FilterSetSimpleRes::from)
                .toList();
    }

    /**
     * 특정 필터 묶음에 포함된 필터 상세 목록 조회
     */
    @Transactional(readOnly = true)
    public List<FilterSetDetailRes> getFiltersInSet(Long filterSetId, Long memberId) {
        FilterSet filterSet = filterSetRepository.findById(filterSetId)
                .orElseThrow(() -> new FilterException(FilterErrorCode.NOT_FOUND));

        if (!filterSet.getTherapistId().equals(memberId)) {
            throw new FilterException(FilterErrorCode.UNAUTHORIZED_ACCESS);
        }

        List<FilterSetInfo> mappings = filterSetInfoRepository.findByFilterSet(filterSet);

        return mappings.stream()
                .map(info -> FilterSetDetailRes.from(info.getFilter()))
                .toList();
    }

    /**
     * 필터 묶음 수정 (이름, 설명, 포함된 필터 모두 갱신)
     */
    @Transactional
    public void updateFilterSet(Long filterSetId, FilterSetUpdateReq request, Long memberId) {
        FilterSet filterSet = filterSetRepository.findById(filterSetId)
                .orElseThrow(() -> new FilterException(FilterErrorCode.NOT_FOUND));

        if (!filterSet.getTherapistId().equals(memberId)) {
            throw new FilterException(FilterErrorCode.UNAUTHORIZED_ACCESS);
        }

        // 이름, 설명 수정
        filterSet.setName(request.getName());
        filterSet.setDescription(request.getDescription());

        // 기존 매핑 삭제 후 재등록
        filterSetInfoRepository.deleteByFilterSet(filterSet);

        for (Long filterId : request.getFilterIds()) {
            Filter filter = filterRepository.findById(filterId)
                    .orElseThrow(() -> new FilterException(FilterErrorCode.FILTER_NOT_FOUND));

            filterSetInfoRepository.save(FilterSetInfo.builder()
                    .filterSet(filterSet)
                    .filter(filter)
                    .build());
        }
    }

    /**
     * 필터 묶음 삭제 (연결된 필터도 함께 삭제)
     */
    @Transactional
    public void deleteFilterSet(Long filterSetId, Long memberId) {
        FilterSet filterSet = filterSetRepository.findById(filterSetId)
                .orElseThrow(() -> new FilterException(FilterErrorCode.NOT_FOUND));

        if (!filterSet.getTherapistId().equals(memberId)) {
            throw new FilterException(FilterErrorCode.UNAUTHORIZED_ACCESS);
        }

        filterSetInfoRepository.deleteByFilterSet(filterSet);
        filterSetRepository.delete(filterSet);
    }
}
