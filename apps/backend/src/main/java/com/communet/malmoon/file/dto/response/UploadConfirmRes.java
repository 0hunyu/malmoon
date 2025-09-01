package com.communet.malmoon.file.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * 업로드 확정(메타 저장) 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "업로드 확정 응답")
public class UploadConfirmRes {

	@Schema(description = "파일 ID (file 테이블 PK)", example = "123")
	private Long fileId;

	@Schema(description = "조회용 Pre-Signed GET URL(짧게)", example = "https://bucket.s3.amazonaws.com/…?X-Amz-Signature=…")
	private String viewUrl;
}
