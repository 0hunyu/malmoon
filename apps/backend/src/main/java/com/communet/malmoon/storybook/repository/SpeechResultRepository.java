package com.communet.malmoon.storybook.repository;

import com.communet.malmoon.storybook.domain.SpeechResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

// SpeechResultRepository.java
public interface SpeechResultRepository extends JpaRepository<SpeechResult, Long> {

    @Query("SELECT s FROM SpeechResult s WHERE s.child.memberId = :childId AND s.createdAt BETWEEN :start AND :end")
    List<SpeechResult> findByChildIdAndCreatedAtBetween(
            @Param("childId") Long childId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT sr FROM SpeechResult sr " +
            "JOIN FETCH sr.sentence s " +
            "WHERE sr.child.memberId = :childId " +
            "AND sr.createdAt BETWEEN :start AND :end")
    List<SpeechResult> findWithSentenceByChildIdAndCreatedAtBetween(
            @Param("childId") Long childId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

}
