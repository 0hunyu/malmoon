package com.communet.malmoon.storybook.dto;
/**
 * 클라이언트가 보낸 JSON 데이터를 Java 객체로 매핑(역직렬화) 하는 데 사용되는 DTO
 */

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class SpeechResultRequestDto {
    private Long childId;
    private Long sentenceId;
    private String srcTextId;
    private int page;
    private MultipartFile audioFile;
}
