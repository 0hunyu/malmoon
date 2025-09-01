package com.communet.malmoon.aac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.communet.malmoon.aac.domain.Aac;

/**
 * AAC 관련 JPA 리포지토리입니다.
 */
@Repository
public interface AacRepository extends JpaRepository<Aac, Long>, JpaSpecificationExecutor<Aac> {

}
