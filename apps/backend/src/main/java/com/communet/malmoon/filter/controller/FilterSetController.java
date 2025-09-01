package com.communet.malmoon.filter.controller;

import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.filter.dto.request.FilterSetCreateReq;
import com.communet.malmoon.filter.dto.request.FilterSetUpdateReq;
import com.communet.malmoon.filter.dto.response.FilterSetCreateRes;
import com.communet.malmoon.filter.dto.response.FilterSetDetailRes;
import com.communet.malmoon.filter.dto.response.FilterSetSimpleRes;
import com.communet.malmoon.filter.service.FilterSetService;
import com.communet.malmoon.member.domain.Member;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/filters/sets")
@Slf4j
@Tag(name = "필터 묶음", description = "FilterSet(필터 묶음) CRUD API")
public class FilterSetController {

    private final FilterSetService filterSetService;

    @PostMapping("/create")
    @Operation(summary = "필터 묶음 생성", description = "기존 필터들을 선택하여 하나의 필터 묶음을 생성합니다.")
    public ResponseEntity<FilterSetCreateRes> createFilterSet(
            @RequestBody FilterSetCreateReq request,
            @CurrentMember Member member
    ) {
        FilterSetCreateRes res = filterSetService.createFilterSet(request, member.getMemberId());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/my")
    @Operation(summary = "내 필터 묶음 목록 조회", description = "로그인한 사용자가 생성한 필터 묶음 목록을 조회합니다.")
    public ResponseEntity<List<FilterSetSimpleRes>> getMyFilterSets(@CurrentMember Member member) {
        List<FilterSetSimpleRes> result = filterSetService.getMyFilterSets(member.getMemberId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my/{filterSetId}")
    @Operation(summary = "필터 묶음 상세 조회", description = "필터 묶음에 포함된 필터들을 순서대로 조회합니다.")
    public ResponseEntity<List<FilterSetDetailRes>> getFiltersInSet(
            @PathVariable("filterSetId") Long filterSetId,
            @CurrentMember Member member
    ) {
        List<FilterSetDetailRes> result = filterSetService.getFiltersInSet(filterSetId, member.getMemberId());
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{filterSetId}")
    @Operation(summary = "필터 묶음 수정", description = "필터 묶음 이름, 설명, 포함된 필터들을 수정합니다.")
    public ResponseEntity<Void> updateFilterSet(
            @PathVariable("filterSetId") Long filterSetId,
            @RequestBody FilterSetUpdateReq request,
            @CurrentMember Member member
    ) {
        filterSetService.updateFilterSet(filterSetId, request, member.getMemberId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{filterSetId}")
    @Operation(summary = "필터 묶음 삭제", description = "필터 묶음과 연결된 필터 정보를 삭제합니다.")
    public ResponseEntity<Void> deleteFilterSet(
            @PathVariable("filterSetId") Long filterSetId,
            @CurrentMember Member member
    ) {
        filterSetService.deleteFilterSet(filterSetId, member.getMemberId());
        return ResponseEntity.noContent().build();
    }
}
