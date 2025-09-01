package com.communet.malmoon.aac.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AAC 묶음에 포함된 AAC 카드를 나타내는 중간 매핑 엔티티입니다.
 * 하나의 Set(AacSet)에 여러 개의 AAC 카드(AacItem)가 포함될 수 있으며,
 * 순서(orderNo) 및 추가 시점(addedAt) 등의 메타데이터도 함께 저장됩니다.
 */
@Entity
@Table(name = "aac_item_set")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AacItemSet {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "aac_item_id", nullable = false)
	private Long aacItemId;

	@Column(name = "aac_set_id", nullable = false)
	private Long aacSetId;

	@Column(name = "order_no", nullable = false)
	private int orderNo;

	@Column(name = "added_at", nullable = false)
	private LocalDateTime addedAt;

	@PrePersist
	protected void onCreate() {
		this.addedAt = LocalDateTime.now();
	}
}
