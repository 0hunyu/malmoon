package com.communet.malmoon.chat.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채팅방 이름 수정 요청 DTO
 */
@Getter
@NoArgsConstructor
public class ChatRoomUpdateNameReq {
	@Schema(description = "새로운 채팅방 이름", example = "언어치료 모임")
	@NotBlank(message = "채팅방 이름은 비어 있을 수 없습니다.")
	private String roomName;
}
