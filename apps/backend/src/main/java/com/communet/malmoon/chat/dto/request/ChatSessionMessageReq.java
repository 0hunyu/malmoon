package com.communet.malmoon.chat.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ChatSessionMessageReq extends ChatMessageReq {
	@Schema(description = "세션 전용 값", example = "세션 UUID 값")
	private String sessionId;
}
