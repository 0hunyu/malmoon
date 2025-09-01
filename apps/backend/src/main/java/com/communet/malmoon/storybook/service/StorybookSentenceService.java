package com.communet.malmoon.storybook.service;

// 장르, 책제목, 페이지에 따라 문장번호 순서대로 문장 응답해주는 로직


import com.communet.malmoon.storybook.domain.StorybookSentence;
import com.communet.malmoon.storybook.dto.*;
import com.communet.malmoon.storybook.repository.StorybookRepository;
import com.communet.malmoon.storybook.repository.StorybookSentenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StorybookSentenceService {

    private final StorybookRepository storybookRepository;
    private final StorybookSentenceRepository sentenceRepository;

    // 1. 장르 목록 조회
    public ClassificationListResponseDto getAllClassifications() {
        return new ClassificationListResponseDto(storybookRepository.findDistinctClassifications());
    }

    // 2. 장르에 따른 제목 목록 조회
    public TitleListResponseDto getTitlesByClassification(String classification) {
        return new TitleListResponseDto(storybookRepository.findTitlesByClassification(classification));
    }

    // 3. 제목에 따른 페이지 범위 조회
    public PageRangeResponseDto getPageRangeByTitle(String title) {
        Object result = sentenceRepository.findMinAndMaxPageByTitle(title);
        Object[] row = (Object[]) result;

        int minPage = ((Number) row[0]).intValue();
        int maxPage = ((Number) row[1]).intValue();

        return new PageRangeResponseDto(minPage, maxPage);
    }

    // 4. 장르 + 제목 + 페이지에 해당하는 문장 목록 조회
    public StorybookSentenceListResponseDto getSentencesByCriteria(String classification, String title, int page) {
        List<StorybookSentence> sentences = sentenceRepository
                .findByStorybook_ClassificationAndStorybook_TitleAndPageOrderBySentenceNumber(classification, title, page);

        List<StorybookSentenceResponseDto> sentenceDtos = sentences.stream()
                .map(s -> new StorybookSentenceResponseDto(s.getId(), s.getSentence(), s.getSentenceNumber()))
                .toList();

        return new StorybookSentenceListResponseDto(classification, title, page, sentenceDtos);
    }
}