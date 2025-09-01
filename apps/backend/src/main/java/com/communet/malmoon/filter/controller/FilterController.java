package com.communet.malmoon.filter.controller;

import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.filter.dto.request.FilterStoreReq;
import com.communet.malmoon.filter.dto.response.FilterLensApiRes;
import com.communet.malmoon.filter.dto.response.FilterListRes;
import com.communet.malmoon.filter.service.FilterService;
import com.communet.malmoon.member.domain.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/filters")
@RequiredArgsConstructor
@Slf4j
public class FilterController {

    @Value("${filter.lens.api.token}")
    private String apiToken;

    private final FilterService filterService;

    @GetMapping("/lens-api")
    public ResponseEntity<FilterLensApiRes> getLensApi() {
        return ResponseEntity.ok(new FilterLensApiRes(apiToken));
    }

    @GetMapping
    public ResponseEntity<FilterListRes> getFilters(@CurrentMember Member member) {
        return ResponseEntity.ok(filterService.getFilters(member));
    }

    @GetMapping("by-ids")
    public ResponseEntity<FilterListRes> getFiltersByIds(@RequestParam("ids") List<Long> ids) {
        return ResponseEntity.ok(filterService.getFiltersByIds(ids));
    }

    @PostMapping
    public ResponseEntity<?> storeFilter(
            @CurrentMember Member member,
            FilterStoreReq filterStoreReq,
            @RequestPart(value = "filter") MultipartFile file) {
        filterService.storeFilter(member, filterStoreReq, file);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping
    public ResponseEntity<?> deleteFilter(
            @CurrentMember Member member,
            Long filterId) {
        filterService.deleteFilter(member, filterId);
        return ResponseEntity.noContent().build();
    }
}
