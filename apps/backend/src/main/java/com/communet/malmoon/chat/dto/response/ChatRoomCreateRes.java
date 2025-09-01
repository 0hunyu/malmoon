package com.communet.malmoon.chat.dto.response;

import java.util.List;

import com.communet.malmoon.chat.domain.RoomType;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채팅방 생성 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomCreateRes {

	@Schema(description = "채팅방 ID", example = "1001")
	private Long roomId;

	@Schema(description = "채팅방 이름", example = "김싸피")
	private String roomName;

	@Schema(description = "채팅방 타입 (1:1 / 그룹)", example = "GROUP")
	private RoomType roomType;

	@Schema(description = "참여자 ID 목록", example = "[1, 2, 3]")
	private List<Long> participantIds;
}
