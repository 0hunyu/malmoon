package com.communet.malmoon.aac.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AAC 묶음 생성 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "AAC 묶음 생성 응답 DTO")
public class AacSetCreateRes {

	@Schema(description = "생성된 AAC 묶음 ID", example = "5")
	private Long aacSetId;

	/**
	 * AAC 묶음 ID를 이용해 응답 객체를 생성하는 팩토리 메서드입니다.
	 *
	 * @param aacSetId 생성된 AAC Set ID
	 * @return AacSetCreateRes 인스턴스
	 */
	public static AacSetCreateRes of(Long aacSetId) {
		return AacSetCreateRes.builder()
			.aacSetId(aacSetId)
			.build();
	}
}
