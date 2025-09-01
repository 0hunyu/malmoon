package com.communet.malmoon.aac.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.communet.malmoon.aac.domain.AacItemSet;

public interface AacItemSetRepository extends JpaRepository<AacItemSet, Long> {
	List<AacItemSet> findByAacSetIdOrderByOrderNo(Long aacSetId);

	void deleteByAacSetId(Long aacSetId);
}
