package com.communet.malmoon.bundle.controller;

import com.communet.malmoon.bundle.dto.request.ToolBundleCreateReq;
import com.communet.malmoon.bundle.dto.request.ToolBundleUpdateReq;
import com.communet.malmoon.bundle.dto.response.ToolBundleRes;
import com.communet.malmoon.bundle.service.ToolBundleService;
import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.member.domain.Member;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tool-bundles")
@Tag(name = "Tool Bundle", description = "AAC와 FilterSet 묶음 CRUD API")
public class ToolBundleController {

    private final ToolBundleService toolBundleService;

    @PostMapping("/create")
    @Operation(summary = "ToolBundle 생성", description = "AACSet과 FilterSet을 묶어 ToolBundle 생성")
    public ResponseEntity<ToolBundleRes> createToolBundle(
            @RequestBody ToolBundleCreateReq req,
            @CurrentMember Member member
    ) {
        ToolBundleRes res = toolBundleService.createToolBundle(req, member.getMemberId());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{toolBundleId}")
    @Operation(summary = "ToolBundle 단건 조회")
    public ResponseEntity<ToolBundleRes> getToolBundle(
            @PathVariable Long toolBundleId,
            @CurrentMember Member member
    ) {
        ToolBundleRes res = toolBundleService.getToolBundle(toolBundleId, member.getMemberId());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/my")
    @Operation(summary = "내 ToolBundle 목록 조회")
    public ResponseEntity<List<ToolBundleRes>> getMyToolBundles(@CurrentMember Member member) {
        List<ToolBundleRes> res = toolBundleService.getMyToolBundles(member.getMemberId());
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/{toolBundleId}")
    @Operation(summary = "ToolBundle 수정")
    public ResponseEntity<ToolBundleRes> updateToolBundle(
            @PathVariable Long toolBundleId,
            @RequestBody ToolBundleUpdateReq req,
            @CurrentMember Member member
    ) {
        ToolBundleRes res = toolBundleService.updateToolBundle(toolBundleId, req, member.getMemberId());
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{toolBundleId}")
    @Operation(summary = "ToolBundle 삭제")
    public ResponseEntity<Void> deleteToolBundle(
            @PathVariable Long toolBundleId,
            @CurrentMember Member member
    ) {
        toolBundleService.deleteToolBundle(toolBundleId, member.getMemberId());
        return ResponseEntity.noContent().build();
    }
}

