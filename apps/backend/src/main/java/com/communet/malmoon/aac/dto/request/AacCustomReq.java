package com.communet.malmoon.aac.dto.request;

import org.springframework.web.multipart.MultipartFile;

import com.communet.malmoon.aac.domain.AacStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 사용자 정의 AAC 등록 요청 DTO
 */
@Data
public class AacCustomReq {

	@Schema(description = "AAC 이름", example = "도와줘")
	private String name;

	@Schema(description = "AAC 상황", example = "긴급")
	private String situation;

	@Schema(description = "AAC 동작", example = "도움 요청")
	private String action;

	@Schema(description = "AAC 감정", example = "불안")
	private String emotion;

	@Schema(description = "AAC 설명", example = "도움을 요청하는 이모지")
	private String description;

	@Schema(description = "AAC 이미지 파일", type = "string", format = "binary")
	private MultipartFile file;

	@Schema(description = "공개 여부", example = "PUBLIC")
	private AacStatus status;
}
