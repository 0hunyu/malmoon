package com.communet.malmoon.storybook.service;

import com.communet.malmoon.storybook.domain.Storybook;
import com.communet.malmoon.storybook.domain.StorybookSentence;
import com.communet.malmoon.storybook.dto.StorybookRequestDto;
import com.communet.malmoon.storybook.repository.StorybookDataRepository;
import com.communet.malmoon.storybook.repository.StorybookSentenceDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * 동화책 JSON 데이터를 DB에 저장하는 전용 서비스
 */
@Service
@RequiredArgsConstructor
public class StorybookDataLoadService {

    private final StorybookDataRepository storybookRepository;
    private final StorybookSentenceDataRepository sentenceRepository;

    public void save(StorybookRequestDto dto) {
        if (storybookRepository.existsByIsbn(dto.getIsbn())) return;

        // 1. 동화책 저장
        Storybook storybook = Storybook.builder()
                .title(dto.getTitle())
                .author(dto.getAuthor())
                .isbn(dto.getIsbn())
                .publishedYear(dto.getPublishedYear())
                .publisher(dto.getPublisher())
                .classification(dto.getClassification())
                .build();

        storybookRepository.save(storybook);

        // 2. 문장 저장
        for (StorybookRequestDto.ParagraphInfo paragraph : dto.getParagraphInfo()) {
            List<String> sentences = splitSentences(paragraph.getSrcText());

            for (int i = 0; i < sentences.size(); i++) {
                StorybookSentence sentence = StorybookSentence.builder()
                        .storybook(storybook)
                        .srcTextId(paragraph.getSrcTextID())
                        .page(paragraph.getSrcPage())
                        .sentenceNumber(i + 1)
                        .sentence(sentences.get(i).trim())
                        .build();

                sentenceRepository.save(sentence);
            }
        }
    }

    private List<String> splitSentences(String paragraph) {
        // 마침표/물음표/느낌표 기준 문장 분리
        return Arrays.stream(paragraph.split("(?<=[.!?])\\s*"))
                .filter(s -> !s.isBlank())
                .toList();
    }
}
