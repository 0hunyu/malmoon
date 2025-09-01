package com.communet.malmoon.chat.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.communet.malmoon.chat.domain.ChatMessage;
import com.communet.malmoon.chat.domain.ChatMessageType;
import com.communet.malmoon.chat.domain.ChatRoom;
import com.communet.malmoon.chat.domain.ChatRoomParticipant;
import com.communet.malmoon.chat.domain.RoomType;
import com.communet.malmoon.chat.dto.request.ChatRoomCreateReq;
import com.communet.malmoon.chat.dto.request.ChatRoomSessionCreateReq;
import com.communet.malmoon.chat.dto.response.ChatParticipantRes;
import com.communet.malmoon.chat.dto.response.ChatRoomCreateRes;
import com.communet.malmoon.chat.dto.response.ChatRoomSummaryRes;
import com.communet.malmoon.chat.exception.ChatErrorCode;
import com.communet.malmoon.chat.exception.ChatException;
import com.communet.malmoon.chat.repository.ChatMessageRepository;
import com.communet.malmoon.chat.repository.ChatRoomParticipantRepository;
import com.communet.malmoon.chat.repository.ChatRoomRepository;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.repository.MemberRepository;
import com.communet.malmoon.member.service.MemberService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements ChatRoomService {

	private final MemberService memberService;
	private final MemberRepository memberRepository;
	private final ChatRoomRepository chatRoomRepository;
	private final ChatRoomParticipantRepository participantRepository;
	private final ChatMessageRepository chatMessageRepository;

	@Override
	@Transactional
	public ChatRoomCreateRes createOrGetRoom(ChatRoomCreateReq request, Long currentId) {
		// 세션 기반 채팅방 생성 요청일 경우
		if (request instanceof ChatRoomSessionCreateReq sessionReq) {
			return createSessionRoom(sessionReq);
		}

		// 기본 1:1 또는 그룹 채팅방 생성 로직
		return createCommonRoom(request, currentId);
	}

	@Override
	public void deleteSessionRoom(Long chatRoomId) {
		ChatRoom room = chatRoomRepository.findById(chatRoomId)
			.orElseThrow(() -> new ChatException(ChatErrorCode.INVALID_ROOM_ID));

		// 종료 시간이 이미 있는 경우 중복 종료 방지 (선택)
		if (room.getEndedAt() != null) {
			return;
		}

		room.setEndedAt(LocalDateTime.now());
		chatRoomRepository.save(room);
	}

	private ChatRoomCreateRes createSessionRoom(ChatRoomSessionCreateReq request) {
		List<Long> participantIds = request.getParticipantIds();
		String sessionId = request.getSessionId();

		// 중복 체크를 위한 세션ID 기반 조회
		Optional<ChatRoom> existingRoom = chatRoomRepository.findBySessionId(sessionId);
		if (existingRoom.isPresent()) {
			return ChatRoomCreateRes.builder()
				.roomId(existingRoom.get().getRoomId())
				.roomType(RoomType.SESSION)
				.participantIds(participantIds)
				.build();
		}

		// 방 생성
		ChatRoom newRoom = ChatRoom.builder()
			.roomType(RoomType.SESSION)
			.sessionId(sessionId)
			.build();
		chatRoomRepository.saveAndFlush(newRoom);

		// 참여자 등록
		for (Long memberId : participantIds) {
			ChatRoomParticipant participant = ChatRoomParticipant.builder()
				.roomId(newRoom.getRoomId())
				.memberId(memberId)
				.build();
			participantRepository.save(participant);
		}

		return ChatRoomCreateRes.builder()
			.roomId(newRoom.getRoomId())
			.roomType(RoomType.SESSION)
			.participantIds(participantIds)
			.build();
	}

	private ChatRoomCreateRes createCommonRoom(ChatRoomCreateReq request, Long currentId) {
		RoomType type = request.getRoomType();
		List<Long> participantIds = request.getParticipantIds();

		// 중복 제거
		Set<Long> uniqueParticipantIds = new HashSet<>(participantIds);
		if (uniqueParticipantIds.size() < 2) {
			throw new ChatException(ChatErrorCode.NOT_ENOUGH_PARTICIPANTS);
		}

		List<Long> sortedIds = new ArrayList<>(uniqueParticipantIds);
		sortedIds.sort(Long::compareTo); // 1:1 채팅 중복 방지용 정렬

		// 1:1 채팅인 경우 동일한 참여자 조합이 존재하는지 조회
		if (type == RoomType.ONE_TO_ONE && participantIds.size() == 2) {
			Optional<ChatRoom> existingRoom = chatRoomRepository
				.findOneToOneRoomByParticipants(participantIds.get(0), participantIds.get(1));
			if (existingRoom.isPresent()) {
				return ChatRoomCreateRes.builder()
					.roomId(existingRoom.get().getRoomId())
					.roomType(type)
					.participantIds(participantIds)
					.build();
			}
		}

		String roomName = request.getRoomName();
		if (roomName == null || roomName.isBlank()) {
			roomName = generateRoomName(request, currentId);
		}
		// 채팅방 생성
		ChatRoom newRoom = ChatRoom.builder()
			.roomType(type)
			.roomName(roomName)
			.build();
		chatRoomRepository.saveAndFlush(newRoom);

		// 참여자 등록
		for (Long memberId : sortedIds) {
			ChatRoomParticipant participant = ChatRoomParticipant.builder()
				.roomId(newRoom.getRoomId())
				.memberId(memberId)
				.build();
			participantRepository.save(participant);
		}

		return ChatRoomCreateRes.builder()
			.roomId(newRoom.getRoomId())
			.roomName(roomName)
			.roomType(type)
			.participantIds(participantIds)
			.build();
	}

	@Override
	public String generateRoomName(ChatRoomCreateReq request, Long currentId) {
		List<Long> participants = request.getParticipantIds();

		// 상대방 ID들만 추출
		List<Long> others = participants.stream()
			.filter(id -> !id.equals(currentId))
			.toList();

		if (request.getRoomType() == RoomType.ONE_TO_ONE) {
			// 상대방 단 1명
			Long opponentId = others.get(0);
			String opponentName = memberService.getNicknameById(opponentId);
			return opponentName;
		} else {
			// 그룹 채팅일 경우
			String firstName = memberService.getNicknameById(others.get(0));
			int othersCount = others.size() - 1;
			return othersCount > 0 ? firstName + " 외 " + othersCount + "명" : firstName;
		}
	}

	@Override
	public List<ChatRoomSummaryRes> getMyChatRooms(Long memberId) {
		List<ChatRoomParticipant> participations = participantRepository.findByMemberIdAndLeftAtIsNull(memberId);

		return participations.stream()
			.map(participant -> {
				Long roomId = participant.getRoomId();
				ChatRoom room = chatRoomRepository.findById(roomId)
					.orElseThrow(() -> new ChatException(ChatErrorCode.INVALID_ROOM_ID));

				if (room.getRoomType() != RoomType.ONE_TO_ONE && room.getRoomType() != RoomType.GROUP) {
					return null;
				}

				if (room.getEndedAt() != null)
					return null;

				ChatMessage lastMessage = chatMessageRepository.findFirstByRoomIdOrderBySentAtDesc(roomId);

				return ChatRoomSummaryRes.builder()
					.roomId(room.getRoomId())
					.roomName(room.getRoomName())
					.roomType(room.getRoomType())
					.lastMessage(lastMessage != null ? lastMessage.getContent() : "")
					.lastMessageTime(lastMessage != null ? lastMessage.getSentAt() : null)
					.build();
			})
			.filter(Objects::nonNull)
			.toList();
	}

	@Override
	@Transactional
	public void updateRoomName(Long roomId, Long memberId, String newName) {
		ChatRoom room = chatRoomRepository.findById(roomId)
			.orElseThrow(() -> new ChatException(ChatErrorCode.INVALID_ROOM_ID));

		// 참여자 검증 (참여 중인 사용자만 수정 가능하도록)
		boolean isParticipant = participantRepository.existsByRoomIdAndMemberId(roomId, memberId);
		if (!isParticipant) {
			throw new ChatException(ChatErrorCode.UNAUTHORIZED_ACCESS);
		}

		room.setRoomName(newName);
		chatRoomRepository.save(room);
	}

	@Override
	public void leaveRoom(Long roomId, Member member) {
		ChatRoom room = chatRoomRepository.findById(roomId)
			.orElseThrow(() -> new ChatException(ChatErrorCode.INVALID_ROOM_ID));

		if (room.getRoomType() != RoomType.ONE_TO_ONE && room.getRoomType() != RoomType.GROUP) {
			throw new ChatException(ChatErrorCode.UNAUTHORIZED_ACCESS);
		}

		ChatRoomParticipant participant = participantRepository.findByRoomIdAndMemberId(roomId, member.getMemberId())
			.orElseThrow(() -> new ChatException(ChatErrorCode.UNAUTHORIZED_ACCESS));

		if (participant.getLeftAt() != null) {
			return;
		}

		ChatMessage leaveMessage = ChatMessage.builder()
			.roomId(roomId)
			.senderId(member.getMemberId())
			.messageType(ChatMessageType.LEAVE)
			.content(member.getNickname() != null ? member.getNickname() : member.getName() + "님이 채팅방을 나갔습니다.")
			.sentAt(LocalDateTime.now())
			.build();

		chatMessageRepository.save(leaveMessage);
		participant.setLeftAt();
		participantRepository.save(participant);

		boolean allLeft = !participantRepository.existsByRoomIdAndLeftAtIsNull(roomId);
		if (allLeft) {
			room.setEndedAt(LocalDateTime.now());
			room.setRoomType(RoomType.ENDED);
			chatRoomRepository.save(room);
		}
	}

	@Override
	public List<ChatParticipantRes> getParticipants(Long roomId) {
		List<ChatRoomParticipant> participants =
			participantRepository.findByRoomIdAndLeftAtIsNull(roomId);

		return participants.stream()
			.map(participant -> {
				Member member = memberRepository.findById(participant.getMemberId())
					.orElseThrow(() -> new ChatException(ChatErrorCode.NOT_FOUND_MEMBER));

				return ChatParticipantRes.builder()
					.memberId(member.getMemberId())
					.name(member.getName())
					.nickname(member.getNickname())
					.profile(member.getProfile())
					.build();
			})
			.toList();
	}

}
