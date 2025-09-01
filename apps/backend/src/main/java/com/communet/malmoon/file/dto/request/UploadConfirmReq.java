package com.communet.malmoon.file.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

/**
 * 업로드 확정(메타 저장) 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "업로드 확정 요청")
public class UploadConfirmReq {

	@NotBlank
	@Schema(description = "S3 오브젝트 키", example = "files/2025/08/AAC/uuid.jpg", requiredMode = Schema.RequiredMode.REQUIRED)
	private String key;

	@NotNull
	@Schema(description = "콘텐츠 타입(MIME)", example = "image/jpeg", requiredMode = Schema.RequiredMode.REQUIRED)
	private String contentType;

	@NotNull @Positive
	@Schema(description = "파일 크기(byte)", example = "1048576", requiredMode = Schema.RequiredMode.REQUIRED)
	private Long size;

	private String etag;
}
