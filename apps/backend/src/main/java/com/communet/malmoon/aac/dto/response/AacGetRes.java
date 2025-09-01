package com.communet.malmoon.aac.dto.response;

import com.communet.malmoon.aac.domain.Aac;
import com.communet.malmoon.aac.domain.AacStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AAC 목록 조회 응답 DTO
 *
 */

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "AAC 조회 응답 DTO")
public class AacGetRes {

	@Schema(description = "AAC ID", example = "1")
	private Long id;

	@Schema(description = "이름", example = "배고파서 식사 요청")
	private String name;

	@Schema(description = "상황", example = "식사")
	private String situation;

	@Schema(description = "행동", example = "요청")
	private String action;

	@Schema(description = "감정", example = "배고픔")
	private String emotion;

	@Schema(description = "설명", example = "밥 먹고 싶을 때 사용하는 AAC")
	private String description;

	@Schema(description = "이미지 URL", example = "https://s3.amazonaws.com/bucket/image.png")
	private String fileUrl;

	@Schema(description = "공개 여부", example = "PUBLIC")
	private AacStatus status;

	/**
	 * AAC 도메인 객체와 이미지 URL을 기반으로 응답 DTO를 생성합니다.
	 *
	 * @param aac AAC 도메인 객체
	 * @param fileUrl S3에서 생성한 이미지 URL
	 * @return AacRes DTO
	 */
	public static AacGetRes from(Aac aac, String fileUrl) {
		return AacGetRes.builder()
			.id(aac.getId())
			.name(aac.getName())
			.situation(aac.getSituation())
			.action(aac.getAction())
			.emotion(aac.getEmotion())
			.description(aac.getDescription())
			.fileUrl(fileUrl)
			.status(aac.getStatus())
			.build();
	}
}
