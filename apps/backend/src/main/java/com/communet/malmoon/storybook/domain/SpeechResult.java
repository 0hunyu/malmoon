package com.communet.malmoon.storybook.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import com.communet.malmoon.member.domain.Member;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeechResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_id")
    private Member child;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sentence_id")
    private StorybookSentence sentence;

    private String sttText;

    private String srcTextId;

    private int page;

    private String audioUrl; // 음성 파일 저장 경로

    private LocalDateTime createdAt;
}
