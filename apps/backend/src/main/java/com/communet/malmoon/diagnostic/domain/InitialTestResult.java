package com.communet.malmoon.diagnostic.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 세션 종료 시 집계 결과(전반 정확도/피드백)
 * PK=attemptId 로 Attempt와 1:1 매핑
 */
@Entity
@Table(name = "initial_test_result")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InitialTestResult {

    @Id
    @Column(columnDefinition = "uuid", name = "attempt_id")
    private UUID attemptId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "attempt_id")
    private InitialTestAttempt attempt;

    @Column(precision = 5, scale = 2)
    private BigDecimal accuracy;        // 0~100, 소수점 두 자리까지

    @Column(columnDefinition = "TEXT")
    private String evaluation;        // ✅ 문자열

    @Column(columnDefinition = "TEXT")
    private String strengths;         // ✅ 문자열 ("- ..\n- .." 포맷)

    @Column(columnDefinition = "TEXT")
    private String improvements;      // ✅ 문자열

    @Column(columnDefinition = "TEXT")
    private String recommendations;   // ✅ 문자열

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate(){
        this.createdAt = LocalDateTime.now();
    }
}
