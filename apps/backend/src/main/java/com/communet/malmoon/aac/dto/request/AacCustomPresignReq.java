package com.communet.malmoon.aac.dto.request;

import org.springframework.web.multipart.MultipartFile;

import com.communet.malmoon.aac.domain.AacStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AacCustomPresignReq {
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

	@Schema(description = "파일 ID", example = "파일 테이블과 맵핑되는 pk")
	private Long fileId;

	@Schema(description = "공개 여부", example = "PUBLIC")
	private AacStatus status;
}
