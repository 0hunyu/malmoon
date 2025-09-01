package com.communet.malmoon.member.repository;

import java.util.List;
import java.util.Optional;

import com.communet.malmoon.member.domain.MemberType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.communet.malmoon.member.domain.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
	boolean existsByEmail(String email);

	Optional<Member> getByEmail(String email);

	Optional<Member> findByEmail(String email);

	List<Member> findByRole(MemberType role);

	Member getMemberInfoByEmail(String therapistEmail);
}
