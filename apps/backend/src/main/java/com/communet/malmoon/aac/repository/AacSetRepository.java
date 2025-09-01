package com.communet.malmoon.aac.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.communet.malmoon.aac.domain.AacSet;

public interface AacSetRepository extends JpaRepository<AacSet, Long> {
	List<AacSet> findAllByTherapistId(Long therapistId);
}
