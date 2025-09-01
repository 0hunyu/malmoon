package com.communet.malmoon.aac.dto.response;

import java.time.LocalDateTime;

import com.communet.malmoon.aac.domain.AacSet;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "AAC 묶음 목록 응답 DTO")
public class AacSetSimpleRes {
	@Schema(description = "AAC 묶음 ID", example = "3")
	private Long id;

	@Schema(description = "묶음 이름", example = "긴급 상황용 AAC")
	private String name;

	@Schema(description = "묶음 설명", example = "응급 시 사용할 AAC 묶음")
	private String description;

	@Schema(description = "생성일시")
	private LocalDateTime createdAt;

	public static AacSetSimpleRes from(AacSet entity) {
		return AacSetSimpleRes.builder()
			.id(entity.getId())
			.name(entity.getName())
			.description(entity.getDescription())
			.createdAt(entity.getCreatedAt())
			.build();
	}
}
