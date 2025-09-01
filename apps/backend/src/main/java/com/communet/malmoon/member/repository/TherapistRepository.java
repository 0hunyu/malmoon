package com.communet.malmoon.member.repository;

import com.communet.malmoon.member.domain.MemberType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.communet.malmoon.member.domain.Therapist;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface TherapistRepository extends JpaRepository<Therapist, Long> {
    @EntityGraph(attributePaths = {"treatmentTimes"})
    Optional<Therapist> findByTherapistId(Long id);

    @EntityGraph(attributePaths = {"member", "careers"})
    List<Therapist> findAllByMember_role(MemberType role);

    @EntityGraph(attributePaths = {"member", "careers"})
    List<Therapist> findAllByMember_roleAndMember_MemberIdNotIn(MemberType role, Set<Long> excludedIds);
}
