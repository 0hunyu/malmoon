package com.communet.malmoon.chat.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_message")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "message_id")
	private Long messageId;

	@Column(name = "roomId", nullable = false)
	private Long roomId;

	@Column(name = "senderId", nullable = false)
	private Long senderId;

	@Column(name = "message_type", nullable = false)
	private ChatMessageType messageType;

	@Column(name = "content", nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(name = "sent_at", nullable = false)
	private LocalDateTime sentAt;

	@PrePersist
	protected void onSent() {
		if (this.sentAt == null) {
			this.sentAt = LocalDateTime.now();
		}
	}
}
