package com.communet.malmoon.aac.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "aac_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Aac {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Long id;

	@Column(name = "name", length = 50, nullable = false)
	private String name;

	@Column(name = "situation", length = 100, nullable = false)
	private String situation;

	@Column(name = "action", length = 50, nullable = false)
	private String action;

	@Column(name = "emotion", length = 30)
	private String emotion;

	@Column(name = "description", nullable = false)
	private String description;

	@Column(name = "file_id", nullable = false)
	private Long fileId;

	@Column(name = "therapist_id", nullable = false)
	private Long therapistId;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private AacStatus status;

	public void changeStatusDeleted() {
		this.status = AacStatus.DELETED;
	}
}
