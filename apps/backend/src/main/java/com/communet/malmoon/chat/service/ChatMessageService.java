package com.communet.malmoon.chat.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.communet.malmoon.chat.dto.request.ChatMessageReq;
import com.communet.malmoon.chat.dto.response.ChatMessageRes;

/**
 * 일반 채팅 메시지를 데이터베이스에 저장하거나
 * 채팅방 ID 기준으로 메시지를 조회하는 서비스 인터페이스입니다.
 */
@Service
public interface ChatMessageService {

	/**
	 * 일반 채팅 메시지를 DB에 저장합니다.
	 *
	 * @param request 저장할 메시지 요청 DTO
	 * @return 저장된 메시지 응답 DTO
	 */
	ChatMessageRes saveToDatabase(ChatMessageReq request);

	/**
	 * 채팅방 ID 기준으로 메시지를 시간순으로 조회합니다.
	 *
	 * @param roomId 조회할 채팅방 ID
	 * @return 메시지 응답 DTO 리스트
	 */
	List<ChatMessageRes> getMessagesByRoomId(Long roomId);

	/**
	 * 특정 채팅방의 마지막 메시지를 조회합니다.
	 *
	 * @param roomId 조회할 채팅방 ID
	 * @return 마지막 메시지 응답 DTO (없을 경우 null 또는 예외 처리 필요)
	 */
	ChatMessageRes getLastMessageByRoomId(Long roomId);
}
