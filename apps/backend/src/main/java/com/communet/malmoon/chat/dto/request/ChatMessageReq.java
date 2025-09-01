package com.communet.malmoon.chat.dto.request;

import java.time.LocalDateTime;

import com.communet.malmoon.chat.domain.ChatMessageType;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ChatMessageReq {

	@Schema(description = "채팅방 ID", example = "1")
	private Long roomId;

	@Schema(description = "보낸 사람 ID", example = "2")
	private Long senderId;

	@Schema(description = "메시지 내용", example = "안녕하세요!")
	private String content;

	@Schema(description = "메시지 타입", example = "TEXT")
	private ChatMessageType messageType;

	@Schema(description = "보낸 시간", example = "2025-08-05T10:30:00")
	private LocalDateTime sendAt;
}
