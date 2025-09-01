package com.communet.malmoon.aac.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AAC 목록 조회 요청 DTO
 *
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AacGetReq {

	@Schema(description = "AAC 상황", example = "긴급")
	private String situation;

	@Schema(description = "AAC 동작", example = "도움 요청")
	private String action;

	@Schema(description = "AAC 감정", example = "불안")
	private String emotion;

	@Schema(description = "페이지 번호", example = "2")
	private int page;
	@Schema(description = "페이지당 개수", example = "10")
	private int size;
}
