package com.communet.malmoon.storybook.repository;

import com.communet.malmoon.storybook.domain.SessionFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SessionFeedbackRepository extends JpaRepository<SessionFeedback, Long> {
    // 📌 1. 피드백 받은 날짜 목록 조회
    @Query("SELECT DISTINCT sf.date FROM SessionFeedback sf WHERE sf.child.memberId = :childId")
    List<LocalDate> findDistinctDatesByChildId(@Param("childId") Long childId);

    // 📌 2. 특정 날짜 피드백 상세 조회
    Optional<SessionFeedback> findByChild_MemberIdAndDate(Long childId, LocalDate date);
}
