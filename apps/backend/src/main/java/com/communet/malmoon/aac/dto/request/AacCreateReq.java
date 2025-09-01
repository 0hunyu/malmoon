package com.communet.malmoon.aac.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AAC 생성 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AacCreateReq {
	@Schema(description = "상황", example = "학교")
	private String situation;

	@Schema(description = "행동", example = "도와줘")
	private String action;

	@Schema(description = "감정 (선택)", example = "당황")
	private String emotion;

	@Schema(description = "재생성 이유 (처음 요청 시 null, 재요청 시 이유 기입)", example = "좀 더 귀엽게 생성해줘")
	private String reason;
}
