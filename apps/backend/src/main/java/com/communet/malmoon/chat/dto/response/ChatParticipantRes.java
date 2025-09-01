package com.communet.malmoon.chat.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

/**
 * 채팅방 참여자 응답 DTO
 */
@Getter
@Builder
public class ChatParticipantRes {
	@Schema(description = "회원 ID", example = "1")
	private Long memberId;

	@Schema(description = "이름", example = "김싸피")
	private String name;

	@Schema(description = "닉네임", example = "싸피최고")
	private String nickname;

	@Schema(description = "프로필 이미지", example = "1")
	private int profile;
}
