package com.communet.malmoon.storybook.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.communet.malmoon.member.domain.Member;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionFeedback {

	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "child_id", nullable = false)
	private Member child;

	@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "storybook_id", nullable = false)
	private Storybook storybook;

	@Column(nullable = false)
	private LocalDate date;

	private double accuracy;
	private Integer lastPage;

	@Column(columnDefinition = "TEXT")
	private String evaluation;        // ✅ 문자열

	@Column(columnDefinition = "TEXT")
	private String strengths;         // ✅ 문자열 ("- ..\n- .." 포맷)

	@Column(columnDefinition = "TEXT")
	private String improvements;      // ✅ 문자열

	@Column(columnDefinition = "TEXT")
	private String recommendations;   // ✅ 문자열

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist void onCreate() { this.createdAt = LocalDateTime.now(); }
}
