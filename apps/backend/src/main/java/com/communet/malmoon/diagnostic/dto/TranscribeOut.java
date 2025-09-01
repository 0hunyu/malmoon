package com.communet.malmoon.diagnostic.dto;

import lombok.*;

/** FastAPI STT 응답 */
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class TranscribeOut {
    private String text;
}