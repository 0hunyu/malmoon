package com.communet.malmoon.file.dto.request;

import org.jetbrains.annotations.NotNull;

import com.communet.malmoon.file.domain.FileType;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PUT Presigned URL 발급 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Pre-Signed PUT URL 발급 요청")
public class PresignPutReq {
	@NotNull
	@Schema(description = "파일 유형 (AAC/PROFILE/…)", example = "AAC", requiredMode = Schema.RequiredMode.REQUIRED)
	private FileType fileType;

	@NotNull
	@Schema(description = "원본 파일명", example = "photo.jpg", requiredMode = Schema.RequiredMode.REQUIRED)
	private String originalFileName;

	@NotNull
	@Schema(description = "콘텐츠 타입(MIME)", example = "image/jpeg", requiredMode = Schema.RequiredMode.REQUIRED)
	private String contentType;

	@NotNull @Positive
	@Schema(description = "파일 크기(byte)", example = "1048576", requiredMode = Schema.RequiredMode.REQUIRED)
	private Long size;

	@Schema(description = "업로드 무결성 체크용 SHA-256(Base64)", example = "base64-encoded-sha256", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
	private String checksumSha256Base64;
}
