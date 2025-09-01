package com.communet.malmoon.member.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.communet.malmoon.common.entity.BaseEntity;

import com.communet.malmoon.filter.domain.Filter;
import com.communet.malmoon.matching.domain.Schedule;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "member")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member extends BaseEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "member_id", nullable = false, updatable = false)
	private Long memberId;

	@Column(name = "email", columnDefinition = "varchar(30)",  nullable = false, unique = true)
	private String email;

	@Column(name = "password", columnDefinition = "varchar(512)", nullable = false)
	private String password;

	@Column(name = "name", columnDefinition = "varchar(30)", nullable = false)
	private String name;

	@Column(name = "nickname", columnDefinition = "varchar(30)", nullable = false)
	private String nickname;

	@Column(name = "birth_date", nullable = false)
	private LocalDate birthDate;

	@Column(name = "tel1", columnDefinition = "varchar(20)", nullable = false)
	private String tel1;

	@Column(name = "tel2", columnDefinition = "varchar(20)")
	private String tel2;

	@Column(name = "role", nullable = false, updatable = false)
	@Enumerated(EnumType.STRING)
	private MemberType role;

	@Column(name = "status", columnDefinition = "varchar(10)", nullable = false)
	@Enumerated(EnumType.STRING)
	private MemberStatusType status;

	@Column(name = "profile", columnDefinition = "INT")
	private Integer profile;

	@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	@JoinColumn(name = "address_id")
	private Address address;

	@OneToMany(mappedBy = "therapist", cascade = CascadeType.ALL)
	@Builder.Default
	private List<Schedule> schedules = new ArrayList<>();

	@OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
	@Builder.Default
	private List<Filter> filters = new ArrayList<>();
}
