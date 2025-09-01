package com.communet.malmoon.file.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.communet.malmoon.file.domain.File;

/**
 * 파일 엔티티 조회를 위한 JPA 리포지토리
 */
@Repository
public interface FileRepository extends JpaRepository<File, Long> {
}
