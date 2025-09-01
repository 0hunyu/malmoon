package com.communet.malmoon.chat.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.communet.malmoon.chat.dto.request.ChatMessageReq;
import com.communet.malmoon.chat.dto.request.ChatSessionMessageReq;
import com.communet.malmoon.chat.dto.response.ChatMessageRes;
import com.communet.malmoon.chat.service.ChatMessageService;
import com.communet.malmoon.chat.service.ChatRedisService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * 채팅 메시지 관련 API를 처리하는 컨트롤러입니다.
 * 실시간 세션 채팅 메시지는 Redis에 저장되고,
 * 일반 채팅 메시지는 즉시 DB에 저장됩니다.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "chatMessage", description = "채팅 메시지 API")
public class ChatMessageController {

	private final ChatRedisService chatRedisService;
	private final ChatMessageService chatMessageService;

	/**
	 * 세션 기반 채팅 메시지를 Redis에 임시 저장합니다.
	 *
	 * @param request 세션 채팅 메시지 요청 객체 (roomId, senderId, content 등 포함)
	 * @return 저장 성공 메시지 반환
	 */
	@Operation(summary = "세션 채팅 메시지 저장", description = "LiveKit 세션 중 채팅 메시지를 Redis에 임시 저장합니다.")
	@PostMapping("/session/message")
	public ResponseEntity<String> saveMessageRedis(@RequestBody ChatSessionMessageReq request) {
		chatRedisService.saveToRedis(request);
		return ResponseEntity.ok("메시지가 Redis에 저장되었습니다.");
	}

	/**
	 * 일반 채팅 메시지를 DB에 저장합니다.
	 *
	 * @param request 일반 채팅 메시지 요청 객체 (roomId, senderId, content 등 포함)
	 * @return 저장된 메시지 정보
	 */
	@Operation(summary = "일반 채팅 메시지 저장", description = "일반 채팅방(1:1, 그룹)의 메시지를 DB에 저장합니다.")
	@PostMapping("/room/message")
	public ResponseEntity<ChatMessageRes> saveMessageToDb(@RequestBody ChatMessageReq request) {
		ChatMessageRes response = chatMessageService.saveToDatabase(request);
		return ResponseEntity.ok(response);
	}

	/**
	 * 특정 채팅방의 모든 메시지를 시간순으로 조회합니다.
	 *
	 * @param roomId 조회할 채팅방 ID
	 * @return 해당 채팅방의 메시지 리스트
	 */
	@Operation(summary = "채팅 메시지 조회", description = "채팅방 ID를 기준으로 메시지를 시간순 조회합니다.")
	@GetMapping("/room/{roomId}/messages")
	public ResponseEntity<List<ChatMessageRes>> getMessages(@PathVariable(name = "roomId") Long roomId) {
		return ResponseEntity.ok(chatMessageService.getMessagesByRoomId(roomId));
	}
}
