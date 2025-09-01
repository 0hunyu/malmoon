package com.communet.malmoon.diagnostic.dto;

import lombok.*;

/** 문항 제출 응답 */
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ItemSubmitResponse {
    private Integer itemIndex;
    private String targetText;
    private String sttText;
    private String audioUrl;
}