package com.communet.malmoon.diagnostic.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * 문항 단위 기록(정답 텍스트, 오디오 URL, STT 결과 등)
 * (attempt_id, item_index) 유니크로 중복 제출 방지
 */
@Entity
@Table(name = "initial_test_item",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_attempt_idx",
                columnNames = {"attempt_id", "item_index"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InitialTestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK: attempt_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private InitialTestAttempt attempt;

    @Column(name = "item_index", nullable = false)
    private Integer itemIndex;                 // 1..10

    @Column(nullable = false)
    private String targetText;                 // 정답 단어/문장

    @Column
    private String sttText;                    // FastAPI STT 응답 텍스트

    @Column
    private String audioUrl;                   // 저장된 오디오 파일 경로

    @Column
    private Integer score;                     // 0~5 (finish 시 계산해서 세팅)
}
