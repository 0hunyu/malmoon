package com.communet.malmoon.diagnostic.controller;

import com.communet.malmoon.diagnostic.dto.*;
import com.communet.malmoon.diagnostic.service.DiagnosticService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

/**
 * 간이 진단 API 엔드포인트
 */
@RestController
@RequestMapping("/api/v1/diagnostic/attempts")
@RequiredArgsConstructor
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    @PostMapping("/start")
    public AttemptStartResponse start(@Valid @RequestBody AttemptStartRequest req) {
        return diagnosticService.startAttempt(req);
    }

    @PostMapping(value = "/{attemptId}/items", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ItemSubmitResponse submitItem(@PathVariable UUID attemptId,
                                         @RequestParam("itemIndex") Integer itemIndex,
                                         @RequestParam("targetText") String targetText,
                                         @RequestPart("file") MultipartFile file) {
        return diagnosticService.submitItem(attemptId, itemIndex, targetText, file);
    }

    @PostMapping("/{attemptId}/finish")
    public FinishResponse finish(@PathVariable UUID attemptId) {
        return diagnosticService.finishAttempt(attemptId);
    }

    @GetMapping("/{attemptId}")
    public AttemptDetailResponse detail(@PathVariable UUID attemptId) {
        return diagnosticService.getAttempt(attemptId);
    }
}
