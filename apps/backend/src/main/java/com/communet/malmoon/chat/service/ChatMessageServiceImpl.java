package com.communet.malmoon.chat.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.communet.malmoon.chat.domain.ChatMessage;
import com.communet.malmoon.chat.dto.request.ChatMessageReq;
import com.communet.malmoon.chat.dto.response.ChatMessageRes;
import com.communet.malmoon.chat.exception.ChatErrorCode;
import com.communet.malmoon.chat.exception.ChatException;
import com.communet.malmoon.chat.repository.ChatMessageRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatMessageServiceImpl implements ChatMessageService {

	private final ChatMessageRepository chatMessageRepository;

	@Override
	@Transactional
	public ChatMessageRes saveToDatabase(ChatMessageReq request) {
		if (request.getRoomId() == null || request.getSenderId() == null || request.getContent() == null) {
			throw new ChatException(ChatErrorCode.MESSAGE_EMPTY);
		}

		ChatMessage message = ChatMessage.builder()
			.roomId(request.getRoomId())
			.senderId(request.getSenderId())
			.content(request.getContent())
			.messageType(request.getMessageType())
			.sentAt(request.getSendAt())
			.build();

		ChatMessage saved = chatMessageRepository.save(message);
		return ChatMessageRes.from(saved);
	}

	@Override
	public List<ChatMessageRes> getMessagesByRoomId(Long roomId) {
		if (roomId == null) {
			throw new ChatException(ChatErrorCode.INVALID_ROOM_ID);
		}

		List<ChatMessage> messages = chatMessageRepository.findByRoomId(roomId);
		return messages.stream()
			.map(ChatMessageRes::from)
			.toList();
	}

	@Override
	public ChatMessageRes getLastMessageByRoomId(Long roomId) {
		ChatMessage lastMessage = chatMessageRepository.findFirstByRoomIdOrderBySentAtDesc(roomId);
		if (lastMessage == null) {
			throw new ChatException(ChatErrorCode.NOT_FOUND);
		}
		return ChatMessageRes.from(lastMessage);
	}
}
