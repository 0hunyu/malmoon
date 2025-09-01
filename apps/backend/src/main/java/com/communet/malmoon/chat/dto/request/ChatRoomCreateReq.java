package com.communet.malmoon.chat.dto.request;

import java.util.List;

import com.communet.malmoon.chat.domain.RoomType;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 채팅방 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ChatRoomCreateReq {
	@Schema(description = "", example = "")
	private String roomName;

	@Schema(description = "채팅방 타입 (1:1 / 그룹)", example = "GROUP")
	private RoomType roomType;

	@Schema(description = "참여자 ID 목록", example = "[1, 2, 3]")
	private List<Long> participantIds;
}
