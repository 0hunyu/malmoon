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
@Table(name = "chat_room_participant")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatRoomParticipant {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "room_id", nullable = false)
	private Long roomId;

	@Column(name = "member_id", nullable = false)
	private Long memberId;

	@Column(name = "joined_at", nullable = false)
	private LocalDateTime joinedAt;

	@Column(name = "left_at")
	private LocalDateTime leftAt;

	@PrePersist
	protected void onJoin() {
		if (this.joinedAt == null) {
			this.joinedAt = LocalDateTime.now();
		}
	}

	public void setLeftAt() {
		if (this.leftAt == null) {
			this.leftAt = LocalDateTime.now();
		}
	}
}
