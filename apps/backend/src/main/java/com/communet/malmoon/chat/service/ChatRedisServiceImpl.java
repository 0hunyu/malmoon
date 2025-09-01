package com.communet.malmoon.chat.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.communet.malmoon.chat.domain.ChatMessage;
import com.communet.malmoon.chat.domain.ChatMessageType;
import com.communet.malmoon.chat.dto.request.ChatSessionMessageReq;
import com.communet.malmoon.chat.exception.ChatErrorCode;
import com.communet.malmoon.chat.exception.ChatException;
import com.communet.malmoon.chat.repository.ChatMessageRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 세션 채팅 메시지 Redis 적재 및 flush 책임.
 * - ENTER는 세션당 사용자별 1회만 저장(SET으로 중복 방지)
 * - flush 시 리스트와 ENTER 세트 모두 정리
 * - 메시지가 하나도 없어도 예외를 던지지 않고 정상 종료
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRedisServiceImpl implements ChatRedisService {

	private final RedisTemplate<String, String> redisTemplate;
	private final ChatMessageRepository chatMessageRepository;
	private final ObjectMapper objectMapper;

	private String getRedisKey(String sessionId) {
		return "chat:session:" + sessionId + ":messages";
	}

	private String getEnteredSetKey(String sessionId) {
		return "chat:session:" + sessionId + ":entered";
	}

	@Override
	public void saveToRedis(ChatSessionMessageReq request) {
		try {
			final String sessionId = String.valueOf(request.getSessionId());
			final String redisKey = getRedisKey(sessionId);

			if (request.getMessageType() == ChatMessageType.ENTER) {
				String enterKey = getEnteredSetKey(sessionId);
				Long added = redisTemplate.opsForSet().add(enterKey, String.valueOf(request.getSenderId()));
				if (added == null || added == 0) {
					// 이미 입장 기록이 있음 → 저장 스킵
					log.debug("ENTER 중복 스킵: sessionId={}, senderId={}", sessionId, request.getSenderId());
					return;
				}
			}
			String json = objectMapper.writeValueAsString(request);
			redisTemplate.opsForList().rightPush(redisKey, json);
		} catch (JsonProcessingException e) {
			log.error("Redis 저장 실패: {}", e.getMessage());
			throw new ChatException(ChatErrorCode.REDIS_SAVE_FAILED);
		}
	}

	@Override
	public void flushSessionMessagesToDb(String sessionId) {
		String listKey = getRedisKey(sessionId);
		String enterKey = getEnteredSetKey(sessionId);

		List<String> messages = redisTemplate.opsForList().range(listKey, 0, -1);

		if (messages == null || messages.isEmpty()) {
			log.info("[flush] 세션 {}: 저장할 메시지가 없어 키만 정리합니다.", sessionId);
			redisTemplate.delete(listKey);
			redisTemplate.delete(enterKey);
			return;
		}

		List<ChatMessage> chatMessages = new ArrayList<>();
		for (String json : messages) {
			try {
				ChatSessionMessageReq request = objectMapper.readValue(json, ChatSessionMessageReq.class);
				ChatMessage message = ChatMessage.builder()
					.roomId(request.getRoomId())
					.senderId(request.getSenderId())
					.content(request.getContent())
					.messageType(request.getMessageType())
					.sentAt(request.getSendAt())
					.build();
				chatMessages.add(message);
			} catch (JsonProcessingException e) {
				log.warn("Redis → 객체 변환 실패: {}", e.getMessage());
				continue;
			}
		}

		try {
			chatMessageRepository.saveAll(chatMessages);
			log.info("[flush] Redis → DB 저장 완료 ({}개) [sessionId={}]", chatMessages.size(), sessionId);

			redisTemplate.delete(listKey);
			redisTemplate.delete(enterKey);
		} catch (Exception e) {
			log.error("DB 저장 실패: {}", e.getMessage());
			throw new ChatException(ChatErrorCode.DB_SAVE_FAILED);
		}
	}
}
