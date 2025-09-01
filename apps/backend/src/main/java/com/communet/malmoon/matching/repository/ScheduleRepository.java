package com.communet.malmoon.matching.repository;

import com.communet.malmoon.matching.domain.Schedule;
import com.communet.malmoon.matching.domain.StatusType;
import com.communet.malmoon.member.domain.Member;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findAllByTherapist_MemberIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long therapistId,
            LocalDate endDate,
            LocalDate startDate
    );

    List<Schedule> findAllByTherapist_MemberIdAndStatus(
            Long therapistId,
            StatusType status
    );

    @Query("select s.therapist.memberId from Schedule s " +
            "where s.member.memberId = :memberId and s.status in :statuses")
    Set<Long> findTherapistIdsByMemberAndStatuses(@Param("memberId") Long memberId,
                                                  @Param("statuses") List<StatusType> statuses);

    List<Schedule> findByMemberAndStatus(Member member, StatusType status);

    void deleteByScheduleIdAndMember(Long scheduleId, Member member);

    List<Schedule> findByTherapistAndStatus(Member therapist, StatusType status);

    @Query("""
    SELECT s FROM Schedule s
    JOIN FETCH s.member m
    JOIN FETCH s.therapist
    LEFT JOIN FETCH s.dayTimes
    WHERE m.memberId = :memberId
    AND s.status = :status
    AND :date BETWEEN s.startDate AND s.endDate
    """)
    List<Schedule> findAcceptedSchedulesByMemberIdAndDate(
            @Param("memberId") Long memberId,
            @Param("status") StatusType status,
            @Param("date") LocalDate date
    );

    @Query("""
    SELECT s FROM Schedule s
    JOIN FETCH s.therapist t
    LEFT JOIN FETCH s.dayTimes
    WHERE s.status = :status
    AND :date BETWEEN s.startDate AND s.endDate
    AND t.memberId = :therapistId
    """)
    List<Schedule> findAcceptedSchedulesByTherapistIdAndDate(
            @Param("therapistId") Long therapistId,
            @Param("status") StatusType status,
            @Param("date") LocalDate date
    );
}
