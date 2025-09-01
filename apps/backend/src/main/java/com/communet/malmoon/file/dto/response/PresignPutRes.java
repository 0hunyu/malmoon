package com.communet.malmoon.file.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * PUT Presigned URL 발급 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Pre-Signed PUT URL 발급 응답")
public class PresignPutRes {
	@Schema(description = "S3로 직접 PUT할 URL", example = "https://bucket.s3.amazonaws.com/…?X-Amz-Signature=…")
	private String uploadUrl;

	@Schema(description = "S3 오브젝트 키(DB 저장용)", example = "files/2025/08/AAC/uuid.jpg")
	private String key;

	@Schema(description = "URL 만료(초)", example = "1200")
	private Long expiresInSec;
}
