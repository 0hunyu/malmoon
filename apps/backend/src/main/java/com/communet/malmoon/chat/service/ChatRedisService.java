package com.communet.malmoon.chat.service;

import com.communet.malmoon.chat.dto.request.ChatSessionMessageReq;

/**
 * 실시간 세션 채팅 메시지를 Redis에 임시 저장하거나
 * 세션 종료 시 DB로 저장하는 기능을 제공하는 서비스 인터페이스입니다.
 */
public interface ChatRedisService {

	/**
	 * 세션 채팅 메시지를 Redis에 저장합니다.
	 *
	 * @param request Redis에 저장할 채팅 메시지 요청 DTO
	 */
	void saveToRedis(ChatSessionMessageReq request);

	/**
	 * 세션 종료 시 Redis에 임시 저장된 메시지를 DB로 저장합니다.
	 *
	 * @param sessionId Redis 키로 사용되는 세션 ID
	 */
	void flushSessionMessagesToDb(String sessionId);
}
