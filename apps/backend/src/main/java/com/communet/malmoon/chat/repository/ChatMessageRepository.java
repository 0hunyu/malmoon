package com.communet.malmoon.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.communet.malmoon.chat.domain.ChatMessage;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
	List<ChatMessage> findByRoomId(Long roomId);

	@Query("SELECT m FROM ChatMessage m WHERE m.roomId = :roomId ORDER BY m.sentAt DESC")
	ChatMessage findFirstByRoomIdOrderBySentAtDesc(@Param("roomId") Long roomId);
}
