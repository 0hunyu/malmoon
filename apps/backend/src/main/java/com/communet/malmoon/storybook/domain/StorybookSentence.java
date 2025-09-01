package com.communet.malmoon.storybook.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class StorybookSentence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 문장id

    @ManyToOne
    @JoinColumn(name = "storybook_id")
    private Storybook storybook; // 외래키(동화책 id)

    private String srcTextId; // 문단id
    private int page; // 페이지
    private int sentenceNumber; // 문장번호

    @Column(length = 2000)
    private String sentence; // 문장텍스트
}
