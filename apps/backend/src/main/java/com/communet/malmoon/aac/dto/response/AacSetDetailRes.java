package com.communet.malmoon.aac.dto.response;

import com.communet.malmoon.aac.domain.Aac;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AAC 묶음 상세 응답 DTO")
public class AacSetDetailRes {
	@Schema(description = "AAC 항목 ID", example = "1")
	private Long id;

	@Schema(description = "AAC 이름", example = "도와줘")
	private String name;

	@Schema(description = "상황", example = "긴급")
	private String situation;

	@Schema(description = "동작", example = "도움 요청")
	private String action;

	@Schema(description = "감정", example = "불안")
	private String emotion;

	@Schema(description = "이미지 파일 ID", example = "100")
	private Long fileId;

	@Schema(description = "정렬 순서", example = "1")
	private int orderNo;

	public static AacSetDetailRes from(Aac item, int orderNo) {
		return AacSetDetailRes.builder()
			.id(item.getId())
			.name(item.getName())
			.situation(item.getSituation())
			.action(item.getAction())
			.emotion(item.getEmotion())
			.fileId(item.getFileId())
			.orderNo(orderNo)
			.build();
	}
}
