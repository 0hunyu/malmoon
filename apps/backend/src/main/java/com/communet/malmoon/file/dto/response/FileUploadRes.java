package com.communet.malmoon.file.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

/**
 * 파일 업로드 응답 DTO
 */
@Getter
@Builder
@Schema(description = "파일 업로드 응답 DTO")
public class FileUploadRes {
	@Schema(description = "파일 ID", example = "1")
	private Long fileId;

	@Schema(description = "S3 이미지 URL", example = "https://bucket.s3.ap-northeast-2.amazonaws.com/aac/image.png")
	private String url;
}
