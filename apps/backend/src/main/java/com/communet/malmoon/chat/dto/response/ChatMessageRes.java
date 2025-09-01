package com.communet.malmoon.chat.dto.response;

import java.time.LocalDateTime;

import com.communet.malmoon.chat.domain.ChatMessage;
import com.communet.malmoon.chat.domain.ChatMessageType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRes {
	private Long messageId;
	private Long roomId;
	private Long senderId;
	private String content;
	private ChatMessageType messageType;
	private LocalDateTime sentAt;

	public static ChatMessageRes from(ChatMessage entity) {
		return ChatMessageRes.builder()
			.messageId(entity.getMessageId())
			.roomId(entity.getRoomId())
			.senderId(entity.getSenderId())
			.content(entity.getContent())
			.messageType(entity.getMessageType())
			.sentAt(entity.getSentAt())
			.build();
	}
}
