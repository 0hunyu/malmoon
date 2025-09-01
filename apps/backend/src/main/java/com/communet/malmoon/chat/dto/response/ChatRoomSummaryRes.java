package com.communet.malmoon.chat.dto.response;

import java.time.LocalDateTime;

import com.communet.malmoon.chat.domain.RoomType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomSummaryRes {
	private Long roomId;
	private String roomName;
	private RoomType roomType;
	private String lastMessage;
	private LocalDateTime lastMessageTime;
}
