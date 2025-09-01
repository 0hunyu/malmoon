package com.communet.malmoon.chat.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.communet.malmoon.chat.dto.request.ChatRoomCreateReq;
import com.communet.malmoon.chat.dto.request.ChatRoomUpdateNameReq;
import com.communet.malmoon.chat.dto.response.ChatMessageRes;
import com.communet.malmoon.chat.dto.response.ChatParticipantRes;
import com.communet.malmoon.chat.dto.response.ChatRoomCreateRes;
import com.communet.malmoon.chat.dto.response.ChatRoomSummaryRes;
import com.communet.malmoon.chat.service.ChatMessageService;
import com.communet.malmoon.chat.service.ChatRoomService;
import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.member.domain.Member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * 채팅방 관련 API를 제공하는 컨트롤러입니다.
 * - 채팅방 생성
 * - 마지막 메시지 조회
 * - 채팅방 목록 조회
 */
@RestController
@RequestMapping("/api/v1/chat/room")
@RequiredArgsConstructor
@Tag(name = "chatRoom", description = "채팅방 관리 API")
public class ChatRoomController {

	private final ChatMessageService chatMessageService;
	private final ChatRoomService chatRoomService;

	/**
	 * 1:1 또는 그룹 채팅방을 생성하거나 기존 방을 반환합니다.
	 *
	 * @param request 채팅방 생성 요청 정보 (참여자 목록, roomType 등)
	 * @param member 현재 로그인한 사용자 정보
	 * @return 생성된 채팅방 정보
	 */
	@Operation(summary = "채팅방 생성", description = "1:1 또는 그룹 채팅방을 생성합니다.")
	@PostMapping
	public ResponseEntity<ChatRoomCreateRes> createRoom(@RequestBody ChatRoomCreateReq request,
		@Parameter(hidden = true) @CurrentMember Member member) {
		ChatRoomCreateRes response = chatRoomService.createOrGetRoom(request, member.getMemberId());
		return ResponseEntity.ok(response);
	}

	/**
	 * 채팅방의 마지막 메시지를 시간순으로 조회합니다.
	 *
	 * @param roomId 조회할 채팅방 ID
	 * @return 해당 채팅방의 마지막 메시지
	 */
	@Operation(summary = "채팅방 마지막 메시지 조회", description = "채팅방 ID를 기준으로 가장 마지막 메시지를 조회합니다.")
	@GetMapping("/{roomId}/last-message")
	public ResponseEntity<ChatMessageRes> getLastMessage(@PathVariable(name = "roomId") Long roomId) {
		ChatMessageRes response = chatMessageService.getLastMessageByRoomId(roomId);
		return ResponseEntity.ok(response);
	}

	/**
	 * 로그인한 사용자가 참여 중인 모든 채팅방 목록을 조회합니다.
	 *
	 * @param member 현재 로그인한 사용자 정보
	 * @return 사용자가 참여 중인 채팅방 요약 목록
	 */
	@Operation(summary = "내 채팅방 목록 조회", description = "로그인한 사용자가 참여 중인 채팅방 목록을 반환합니다.")
	@GetMapping("/myList")
	public ResponseEntity<List<ChatRoomSummaryRes>> getMyChatRooms(
		@CurrentMember Member member
	) {
		Long memberId = member.getMemberId();
		List<ChatRoomSummaryRes> response = chatRoomService.getMyChatRooms(memberId);
		return ResponseEntity.ok(response);
	}

	/**
	 * 채팅방 이름을 수정합니다.
	 *
	 * @param roomId 수정할 채팅방 ID
	 * @param request 새로운 채팅방 이름을 담은 요청 객체
	 * @param member 현재 로그인한 사용자 정보
	 * @return 200 OK
	 */
	@Operation(summary = "채팅방 이름 수정", description = "참여 중인 채팅방의 이름을 수정합니다.")
	@PatchMapping("/{roomId}/name")
	public ResponseEntity<Void> updateRoomName(
		@PathVariable("roomId") Long roomId,
		@RequestBody ChatRoomUpdateNameReq request,
		@Parameter(hidden = true) @CurrentMember Member member
	) {
		chatRoomService.updateRoomName(roomId, member.getMemberId(), request.getRoomName());
		return ResponseEntity.ok().build();
	}

	@Operation(summary = "채팅방 나가기", description = "사용자가 채팅방에서 나갑니다.")
	@PatchMapping("/{roomId}/leave")
	public ResponseEntity<Void> leaveRoom(@PathVariable Long roomId,
		@Parameter(hidden = true) @CurrentMember Member member) {
		chatRoomService.leaveRoom(roomId, member);
		return ResponseEntity.ok().build();
	}

	@Operation(summary = "채팅방 참여자 목록 조회", description = "채팅방에 참여 중인 사용자 목록을 반환합니다.")
	@GetMapping("/{roomId}/participants")
	public ResponseEntity<List<ChatParticipantRes>> getParticipants(@PathVariable(name = "roomId") Long roomId) {
		List<ChatParticipantRes> response = chatRoomService.getParticipants(roomId);
		return ResponseEntity.ok(response);
	}
}
