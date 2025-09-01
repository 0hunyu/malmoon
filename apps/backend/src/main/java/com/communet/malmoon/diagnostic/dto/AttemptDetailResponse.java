package com.communet.malmoon.diagnostic.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** 상세 조회 응답 */
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class AttemptDetailResponse {
    private UUID attemptId;
    private Long childId;
    private String ageGroup;
    private LocalDateTime createdAt;
    private BigDecimal accuracy;
    private String evaluation;
    private String strengths;
    private String improvements;
    private String recommendations;
    private List<FinishResponse.ItemResult> items;
}