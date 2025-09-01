package com.communet.malmoon.session.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.communet.malmoon.chat.domain.ChatMessage;
import com.communet.malmoon.chat.domain.ChatMessageType;
import com.communet.malmoon.chat.domain.RoomType;
import com.communet.malmoon.chat.dto.request.ChatRoomSessionCreateReq;
import com.communet.malmoon.chat.dto.request.ChatSessionMessageReq;
import com.communet.malmoon.chat.dto.response.ChatRoomCreateRes;
import com.communet.malmoon.chat.exception.ChatErrorCode;
import com.communet.malmoon.chat.exception.ChatException;
import com.communet.malmoon.chat.repository.ChatMessageRepository;
import com.communet.malmoon.chat.service.ChatRedisService;
import com.communet.malmoon.chat.service.ChatRoomService;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.repository.MemberRepository;
import com.communet.malmoon.session.config.LiveKitConfig;
import com.communet.malmoon.session.dto.response.SessionTokenRes;
import com.communet.malmoon.session.service.retry.FailedRoomDeletionQueue;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import io.livekit.server.WebhookReceiver;
import jakarta.persistence.EntityNotFoundException;
import livekit.LivekitWebhook;
import lombok.extern.slf4j.Slf4j;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * LiveKit 세션 생성/참여/종료 및 채팅방 연동을 담당하는 서비스.
 * - 치료사/클라이언트 최초 입장 시 ENTER 시스템 메시지를 Redis에 1회 저장
 * - 세션 종료 시 LEAVE 메시지는 즉시 DB 저장, 나머지는 Redis → DB flush
 */
@Slf4j
@Service
public class SessionService {

	private final String REDIS_ROOM_PREFIX = "session:room:";
	private final String REDIS_THERAPIST_PREFIX = "user:therapist:";
	private final String REDIS_CLIENT_PREFIX = "user:client:";
	private final String REDIS_CHAT_ROOM_PREFIX = "chat:session:";

	private final LiveKitConfig liveKitConfig;
	private final RedisTemplate<String, Object> redisTemplate;
	private final HashOperations<String, Object, Object> hashOps;
	private final MemberRepository memberRepository;
	private final RoomServiceClient roomServiceClient;

	private final ChatRoomService chatRoomService;
	private final ChatRedisService chatRedisService;
	private final ChatMessageRepository chatMessageRepository;

	private final FailedRoomDeletionQueue failedRoomDeletionQueue;

	public SessionService(
		@Qualifier("redisTemplate0") RedisTemplate<String, Object> redisTemplate,
		MemberRepository memberRepository,
		LiveKitConfig liveKitConfig,
		RoomServiceClient roomServiceClient,
		ChatRoomService chatRoomService,
		ChatRedisService chatRedisService,
		ChatMessageRepository chatMessageRepository,
		FailedRoomDeletionQueue failedRoomDeletionQueue) {
		this.liveKitConfig = liveKitConfig;
		this.redisTemplate = redisTemplate;
		this.hashOps = redisTemplate.opsForHash();
		this.memberRepository = memberRepository;
		this.roomServiceClient = roomServiceClient;
		this.chatRoomService = chatRoomService;
		this.chatRedisService = chatRedisService;
		this.chatMessageRepository = chatMessageRepository;
		this.failedRoomDeletionQueue = failedRoomDeletionQueue;
	}

	/**
	 * 치료사가 세션 방을 생성하고, Redis에 관련 정보 저장 후 토큰 반환
	 * - 기존 세션이 있으면 재접속
	 * - 랜덤 UUID로 room 생성
	 * - Redis에 therapist, client, 생성 시간 저장
	 * - 채팅방 자동 생성 및 세션 Id < - > ChatRoomId 매핑 저장
	 *
	 * @param therapist 현재 로그인한 치료사
	 * @param clientId 세션을 할 클라이언트 ID
	 * @return JWT 기반 LiveKit 세션 접속 토큰
	 */
	@Transactional
	public SessionTokenRes storeRoomInfo(Member therapist, Long clientId) { // 여기 수정함

		// 이미 생성한 세션이 있으면 재입장
		if (redisTemplate.hasKey(REDIS_THERAPIST_PREFIX + therapist.getEmail())) {
			String roomName = Objects.requireNonNull(
					redisTemplate.opsForValue().get(REDIS_THERAPIST_PREFIX + therapist.getEmail()), "생성한 세션이 없습니다.")
				.toString();

			String chatRoomIdStr = (String)redisTemplate.opsForValue().get(REDIS_CHAT_ROOM_PREFIX + roomName);

			if (chatRoomIdStr == null || chatRoomIdStr.isBlank()) {
				throw new ChatException(ChatErrorCode.INVALID_ROOM_ID);
			}

			Long chatRoomId = Long.valueOf(chatRoomIdStr);

			return SessionTokenRes.builder()
				.token(generateAccessToken(therapist, roomName))
				.chatRoomId(chatRoomId)
				.build();
		}

		// roomName 생성 & Redis Hash에 방 정보 저장
		String roomName = UUID.randomUUID().toString();
		String clientEmail = getClientEmail(clientId);
		String sessionKey = REDIS_ROOM_PREFIX + roomName;
		String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

		// Redis Hash에 방 정보 저장
		Map<String, Object> sessionData = new HashMap<>();
		sessionData.put("therapist", therapist.getEmail());
		sessionData.put("client", clientEmail);
		sessionData.put("createdAt", now);
		hashOps.putAll(sessionKey, sessionData);

		// 채팅방 자동 생성
		ChatRoomCreateRes createdRoom = createSessionChatRoom(roomName, therapist.getMemberId(), clientId);

		// Redis String에 therapist/client → roomName 매핑 저장
		redisTemplate.opsForValue().set(REDIS_THERAPIST_PREFIX + therapist.getEmail(), roomName);
		redisTemplate.opsForValue().set(REDIS_CLIENT_PREFIX + clientEmail, roomName);

		chatRedisService.saveToRedis(enterMessage(roomName, createdRoom.getRoomId(), therapist));

		// 여기 추가함
		return SessionTokenRes.builder()
			.token(generateAccessToken(therapist, roomName))
			.chatRoomId(createdRoom.getRoomId())
			.build();
	}

	/**
	 * 세션용 채팅방 생성 및 Redis 매핑 저장
	 */
	private ChatRoomCreateRes createSessionChatRoom(String roomName, Long therapistId, Long clientId) { // 여기 수정함
		ChatRoomCreateRes createdRoom = chatRoomService.createOrGetRoom(
			ChatRoomSessionCreateReq.builder()
				.sessionId(roomName)
				.roomName("세션 채팅방")
				.roomType(RoomType.SESSION)
				.participantIds(List.of(therapistId, clientId))
				.build(), therapistId);

		redisTemplate.opsForValue().set(
			REDIS_CHAT_ROOM_PREFIX + roomName,
			createdRoom.getRoomId().toString()
		);

		return createdRoom; // 여기 추가함
	}

	private ChatSessionMessageReq enterMessage(String roomName, Long chatRoomId, Member member) {
		String display = displayName(member);

		return ChatSessionMessageReq.builder()
			.sessionId(roomName)
			.roomId(chatRoomId)
			.senderId(member.getMemberId())
			.messageType(ChatMessageType.ENTER)
			.content(display + "님이 입장했습니다.")
			.sendAt(LocalDateTime.now())
			.build();
	}

	/**
	 * 치료사의 세션 방 정보를 Redis에서 삭제
	 * @param therapistEmail 삭제 대상 치료사 이메일
	 */
	@Transactional
	public void deleteRoomInfo(String therapistEmail) {
		String roomName = Objects.requireNonNull(
			redisTemplate.opsForValue().get(REDIS_THERAPIST_PREFIX + therapistEmail), "생성한 세션이 없습니다.").toString();
		String clientEmail = Objects.requireNonNull(hashOps.get(REDIS_ROOM_PREFIX + roomName, "client")).toString();

		redisTemplate.delete(REDIS_ROOM_PREFIX + roomName);
		redisTemplate.delete(REDIS_THERAPIST_PREFIX + therapistEmail);
		redisTemplate.delete(REDIS_CLIENT_PREFIX + clientEmail);

		handleChatRoomOnSessionEnd(therapistEmail, roomName);

		roomServiceClient.deleteRoom(roomName).enqueue(new Callback<Void>() {
			@Override
			public void onResponse(Call<Void> call, Response<Void> response) {
				if (response.isSuccessful()) {
					log.info("{} room 세션 삭제 성공", roomName);
				} else {
					log.warn("삭제 실패: {}, 재시도 큐에 등록", response.code());
					failedRoomDeletionQueue.add(roomName, 1);
				}
			}

			@Override
			public void onFailure(Call<Void> call, Throwable t) {
				log.warn("삭제 요청 실패: {}, 재시도 큐에 등록", t.getMessage());
				failedRoomDeletionQueue.add(roomName, 1);
			}
		});
	}

	/**
	 * 세션 종료 시 채팅방 상태 및 메시지를 처리합니다.
	 * - 채팅방 종료 메시지 저장
	 * - 채팅방 soft delete 처리
	 * - Redis → DB flush 처리
	 *
	 * @param therapistEmail 치료사 이메일
	 * @param roomName       세션 이름 (roomName)
	 */
	private void handleChatRoomOnSessionEnd(String therapistEmail, String roomName) {
		Member member = memberRepository.getMemberInfoByEmail(therapistEmail);
		if (member == null) {
			throw new ChatException(ChatErrorCode.NOT_FOUND_MEMBER);
		}

		String chatRoomIdStr = (String)redisTemplate.opsForValue().get(REDIS_CHAT_ROOM_PREFIX + roomName);

		if (chatRoomIdStr != null && !chatRoomIdStr.isBlank()) {
			Long chatRoomId = Long.valueOf(chatRoomIdStr);

			ChatMessage leaveMessage = ChatMessage.builder()
				.roomId(chatRoomId)
				.senderId(member.getMemberId())
				.messageType(ChatMessageType.LEAVE)
				.content("치료 세션 종료")
				.sentAt(LocalDateTime.now())
				.build();
			chatMessageRepository.save(leaveMessage);

			// 방 종료 처리
			chatRoomService.deleteSessionRoom(chatRoomId);

			// flush: 메시지 없어도 예외 없음
			chatRedisService.flushSessionMessagesToDb(roomName);

			// 세션 매핑 제거
			redisTemplate.delete(REDIS_CHAT_ROOM_PREFIX + roomName);
		}
	}

	/**
	 * 클라이언트가 참여 중인 방 이름을 얻고, 접속 토큰 반환
	 * @param client 현재 로그인한 클라이언트
	 * @return JWT 기반 LiveKit 세션 접속 토큰
	 */
	public SessionTokenRes getJoinRoomName(Member client) { // 여기 수정함
		String key = REDIS_CLIENT_PREFIX + client.getEmail();
		if (redisTemplate.hasKey(key)) {
			String roomName = Objects.requireNonNull(
				redisTemplate.opsForValue().get(key), "참여할 수 있는 세션이 없습니다.").toString();

			String chatRoomIdStr = (String)redisTemplate.opsForValue().get(REDIS_CHAT_ROOM_PREFIX + roomName);

			if (chatRoomIdStr == null || chatRoomIdStr.isBlank()) {
				throw new ChatException(ChatErrorCode.INVALID_ROOM_ID);
			}

			Long chatRoomId = Long.valueOf(chatRoomIdStr);

			chatRedisService.saveToRedis(enterMessage(roomName, chatRoomId, client));

			return SessionTokenRes.builder()
				.token(generateAccessToken(client, roomName))
				.chatRoomId(chatRoomId)
				.build();
		}

		String roomName = Objects.requireNonNull(
			redisTemplate.opsForValue().get(REDIS_CLIENT_PREFIX + client.getEmail()), "참여할 수 있는 세션이 없습니다.").toString();

		// 여기 추가함
		String chatRoomIdStr = (String)redisTemplate.opsForValue().get(REDIS_CHAT_ROOM_PREFIX + roomName);

		if (chatRoomIdStr == null || chatRoomIdStr.isBlank()) {
			throw new ChatException(ChatErrorCode.INVALID_ROOM_ID);
		}

		Long chatRoomId = Long.valueOf(chatRoomIdStr);

		chatRedisService.saveToRedis(enterMessage(roomName, chatRoomId, client));

		return SessionTokenRes.builder()
			.token(generateAccessToken(client, roomName))
			.chatRoomId(chatRoomId)
			.build();
	}

	public void getWebhookReceiver(String authHeader, String body) {
		WebhookReceiver webhookReceiver = new WebhookReceiver(liveKitConfig.getApiKey(), liveKitConfig.getApiSecret());
		try {
			LivekitWebhook.WebhookEvent event = webhookReceiver.receive(body, authHeader);
			log.info("LiveKit Webhook: " + event.toString());
		} catch (Exception e) {
			log.error("Error validating webhook event: " + e.getMessage());
		}
	}

	private String getClientEmail(Long clientId) {
		// 윤지훈: clientId가 null인 경우 예외 처리 추가
		if (clientId == null) {
			throw new IllegalArgumentException("Client ID cannot be null when fetching client email.");
		}
		Optional<Member> client = memberRepository.findById(clientId);
		if (client.isEmpty()) {
			throw new EntityNotFoundException("해당 멤버를 찾을 수 없습니다.");
		}
		return client.get().getEmail();
	}

	/**
	 * LiveKit 방 입장용 Access Token 생성
	 * @param member 사용자 (치료사 또는 클라이언트)
	 * @param roomName 방 이름
	 * @return JWT 토큰 문자열
	 */
	private String generateAccessToken(Member member, String roomName) {
		AccessToken token = new AccessToken(liveKitConfig.getApiKey(), liveKitConfig.getApiSecret());
		token.setName(displayName(member));
		token.setIdentity(member.getEmail());
		token.addGrants(new RoomJoin(true), new RoomName(roomName));
		return token.toJwt();
	}

	private String displayName(Member m) {
		return (m.getNickname() != null && !m.getNickname().isBlank()) ? m.getNickname() : m.getName();
	}
}
