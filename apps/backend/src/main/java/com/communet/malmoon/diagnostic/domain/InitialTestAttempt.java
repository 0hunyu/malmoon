package com.communet.malmoon.diagnostic.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 한 번의 간이 진단 세션(10문항)을 대표하는 엔티티
 */
@Entity
@Table(name = "initial_test_attempt")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InitialTestAttempt {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID attemptId;               // 서버에서 UUID.randomUUID()로 생성

    @Column(nullable = false)
    private Long childId;                 // 치료 아동 ID (Member 등 외래키 대상의 PK)

    @Column(nullable = false, length = 16)
    private String ageGroup;              // "PRESCHOOL" | "SCHOOLAGE"

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;      // 생성 시각

    @PrePersist
    void onCreate() {
        if (attemptId == null) attemptId = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
    }
}
