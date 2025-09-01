package com.communet.malmoon.storybook.repository;
// 동화책 문장 조회 전용 레포지토리
// 동화책 문장 테이블 JPA 인터페이스 생성
import com.communet.malmoon.storybook.domain.StorybookSentence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface StorybookSentenceRepository extends JpaRepository<StorybookSentence, Long> {
    // 특정 제목의 페이지 범위 조회
    @Query("SELECT MIN(s.page), MAX(s.page) FROM StorybookSentence s WHERE s.storybook.title = :title")
    Object findMinAndMaxPageByTitle(@Param("title") String title);


    // 장르 + 제목 + 페이지로 문장 조회
    List<StorybookSentence> findByStorybook_ClassificationAndStorybook_TitleAndPageOrderBySentenceNumber(
            String classification, String title, int page);
}