package com.communet.malmoon.aac.dto.request;

import com.communet.malmoon.aac.domain.AacStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AacCompleteReq {
	@NotBlank
	@Schema(example = "AAC/550e8400-e29b-41d4-a716-446655440000.png")
	private String key;

	@NotNull
	@Schema(example = "1048576")
	private Long size;

	@NotBlank
	@Schema(example = "image/png")
	private String contentType;

	private String etag;

	// AAC 메타
	@NotBlank private String name;
	@NotBlank private String situation;
	@NotBlank private String action;
	private String emotion;
	@NotBlank private String description;
	@NotNull  private AacStatus status;
}
