package com.communet.malmoon.storybook.controller;

import com.communet.malmoon.storybook.dto.*;
import com.communet.malmoon.storybook.service.StorybookSentenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/storybooks")
@RequiredArgsConstructor
public class StorybookController {

    private final StorybookSentenceService sentenceService;

    // 1. 장르 목록
    @GetMapping("/classifications")
    public ResponseEntity<ClassificationListResponseDto> getClassifications() {
        return ResponseEntity.ok(sentenceService.getAllClassifications());
    }

    // 2. 제목 목록
    @GetMapping("/titles")
    public ResponseEntity<TitleListResponseDto> getTitles(@RequestParam String classification) {
        return ResponseEntity.ok(sentenceService.getTitlesByClassification(classification));
    }

    // 3. 페이지 범위
    @GetMapping("/pages")
    public ResponseEntity<PageRangeResponseDto> getPageRange(@RequestParam String title) {
        return ResponseEntity.ok(sentenceService.getPageRangeByTitle(title));
    }

    // 4. 문장 목록
    @GetMapping("/sentences")
    public ResponseEntity<StorybookSentenceListResponseDto> getSentences(
            @RequestParam String classification,
            @RequestParam String title,
            @RequestParam int page) {
        return ResponseEntity.ok(sentenceService.getSentencesByCriteria(classification, title, page));
    }
}
