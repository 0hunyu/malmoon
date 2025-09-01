package com.communet.malmoon.aac.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

/**
 * AAC 생성 응답 DTO
 */
@Getter
@Builder
public class AacCreateRes {
	@Schema(description = "생성된 미리보기 이미지 URL", example = "https://s3.amazonaws.com/preview/abc123.png")
	private final String previewUrl;

	/**
	 * 미리보기 URL을 기반으로 응답 객체 생성
	 * @param previewUrl 이미지 미리보기 URL
	 * @return AacCreateRes 인스턴스
	 */
	public static AacCreateRes of(String previewUrl) {
		return AacCreateRes.builder()
			.previewUrl(previewUrl)
			.build();
	}
}
