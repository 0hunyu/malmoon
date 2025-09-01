package com.communet.malmoon.diagnostic.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/** 시작 응답 */
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class AttemptStartResponse {
    private UUID attemptId;
    private String ageGroup;
    private LocalDateTime createdAt;
    public static AttemptStartResponse of(UUID attemptId, String ageGroup, LocalDateTime createdAt){
        return AttemptStartResponse.builder().attemptId(attemptId).ageGroup(ageGroup).createdAt(createdAt).build();
    }
}