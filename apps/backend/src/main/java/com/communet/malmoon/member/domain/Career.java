package com.communet.malmoon.member.domain;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "career")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Career {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "career_id", nullable = false, updatable = false)
	private Long careerId;

	@Column(name = "company", columnDefinition = "varchar(30)",  nullable = false)
	private String company;

	@Column(name = "position", columnDefinition = "varchar(30)",  nullable = false)
	private String position;

	@Column(name = "start_date", columnDefinition = "date",  nullable = false)
	@JsonProperty("start_date")
	private LocalDate startDate;

	@Column(name = "end_date", columnDefinition = "date")
	@JsonProperty("end_date")
	private LocalDate endDate;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "therapist_id")
	@JsonIgnore
	private Therapist therapist;
}
