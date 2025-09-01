package com.communet.malmoon.aac.dto.request;

import com.communet.malmoon.aac.domain.AacStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "AAC 확정 요청")
public class AacConfirmReq {
	@Schema(description = "AAC 이름", example = "학교에서 도움 요청")
	private String name;

	@Schema(description = "상황", example = "학교")
	private String situation;

	@Schema(description = "행동", example = "도와줘")
	private String action;

	@Schema(description = "감정 (선택)", example = "당황")
	private String emotion;

	@Schema(description = "재생성 이유 (처음 요청 시 null, 재요청 시 이유 기입)", example = "좀 더 귀엽게 생성해줘")
	private String reason;

	@Schema(description = "FastAPI에서 생성된 임시 이미지 경로", example = "/static/temp/abc123.png")
	private String imagePath;

	@Schema(description = "AAC 설명", example = "학교에서 급작한 상황에 도움을 필요로 하는 AAC")
	private String description;

	@Schema(description = "생성한 이미지 공개 여부", example = "PUBLIC")
	private AacStatus status;
}
