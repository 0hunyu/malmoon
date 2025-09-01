package com.communet.malmoon.storybook.controller;

import com.communet.malmoon.storybook.dto.SessionFeedbackRequestDto;
import com.communet.malmoon.storybook.dto.FeedbackDetailResponseDto;
import com.communet.malmoon.storybook.service.SessionFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/session-feedback")
@RequiredArgsConstructor
public class SessionFeedbackController {

    private final SessionFeedbackService sessionFeedbackService;
    // 피드백 생성 엔드포인트
    @PostMapping("/end")
    public ResponseEntity<String> endSessionAndGenerateFeedback(
            @RequestBody SessionFeedbackRequestDto requestDto
    ) {
        sessionFeedbackService.processFeedbackAfterLesson(requestDto);
        return ResponseEntity.ok("세션 종료 및 피드백 생성 완료");
    }

    // 1. 피드백 날짜 목록 조회
    @GetMapping("/dates")
    public ResponseEntity<Map<String, List<LocalDate>>> getFeedbackDates(@RequestParam Long childId) {
        List<LocalDate> dates = sessionFeedbackService.findFeedbackDatesByChild(childId);
        return ResponseEntity.ok(Map.of("dates", dates));
    }

    // 2. 특정 날짜의 상세 피드백 조회
    @GetMapping("/detail")
    public ResponseEntity<FeedbackDetailResponseDto> getFeedbackDetail(
            @RequestParam Long childId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        FeedbackDetailResponseDto dto = sessionFeedbackService.getFeedbackDetail(childId, date);
        return ResponseEntity.ok(dto);
    }
}
