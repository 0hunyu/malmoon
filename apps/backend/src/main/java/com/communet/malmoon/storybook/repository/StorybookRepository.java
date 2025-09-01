package com.communet.malmoon.storybook.repository;
// 동화책 장르, 제목 조회 전용 레포지토리

import com.communet.malmoon.storybook.domain.Storybook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StorybookRepository extends JpaRepository<Storybook, Long> {
    // 장르 목록 조회
    @Query("SELECT DISTINCT s.classification FROM Storybook s")
    List<String> findDistinctClassifications();

    // 특정 장르에 해당하는 제목 리스트
    @Query("SELECT s.title FROM Storybook s WHERE s.classification = :classification")
    List<String> findTitlesByClassification(String classification);

    Optional<Storybook> findByTitleIgnoreCase(String title);
}
