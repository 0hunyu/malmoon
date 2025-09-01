package com.communet.malmoon.member.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.communet.malmoon.member.domain.Career;

public interface CareerRepository extends JpaRepository<Career, Long> {
	List<Career> findByTherapist_TherapistId(Long therapistId);
	void deleteByTherapist_TherapistId(Long therapistId);
}
