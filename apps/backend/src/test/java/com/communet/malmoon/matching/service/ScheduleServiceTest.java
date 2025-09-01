package com.communet.malmoon.matching.service;

import com.communet.malmoon.matching.domain.DayTime;
import com.communet.malmoon.matching.domain.DayType;
import com.communet.malmoon.matching.domain.Schedule;
import com.communet.malmoon.matching.domain.StatusType;
import com.communet.malmoon.matching.dto.request.DayTimeReq;
import com.communet.malmoon.matching.dto.request.ScheduleGetReq;
import com.communet.malmoon.matching.dto.request.SchedulePostReq;
import com.communet.malmoon.matching.dto.request.ScheduleUpdateReq;
import com.communet.malmoon.matching.dto.response.ScheduleGetRes;
import com.communet.malmoon.matching.repository.ScheduleRepository;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.repository.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private ScheduleService scheduleService;

    private Member therapist;
    private Member requester;

    @BeforeEach
    void setUp() {
        therapist = Member.builder().memberId(1L).build();
        requester = Member.builder().memberId(2L).build();
    }

    @Test
    void getSchedules_TherapistNotFound_ThrowsException() {
        long therapistId = 1L;
        when(memberRepository.existsById(therapistId)).thenReturn(false);

        ScheduleGetReq req = new ScheduleGetReq();
        req.setTherapistId(therapistId);
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now());

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> scheduleService.getSchedules(req.getTherapistId(), req.getStartDate(), req.getEndDate()));
        assertEquals("해당 치료사가 존재하지 않습니다.", ex.getMessage());
    }

    @Test
    void getSchedules_Success_ReturnsFlattenedDayTimes() {
        long therapistId = 1L;
        when(memberRepository.existsById(therapistId)).thenReturn(true);

        Schedule schedule = Schedule.builder()
                .therapist(therapist)
                .startDate(LocalDate.of(2025, 8, 1))
                .endDate(LocalDate.of(2025, 8, 31))
                .build();
        DayTime dt1 = DayTime.builder().day(DayType.MONDAY).time(10).build();
        DayTime dt2 = DayTime.builder().day(DayType.TUESDAY).time(11).build();
        schedule.addAllDayTimes(Arrays.asList(dt1, dt2));

        ScheduleGetReq req = new ScheduleGetReq();
        req.setTherapistId(therapistId);
        req.setStartDate(LocalDate.of(2025, 8, 1));
        req.setEndDate(LocalDate.of(2025, 8, 31));

        when(scheduleRepository.findAllByTherapist_MemberIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                therapistId, req.getEndDate(), req.getStartDate()))
                .thenReturn(List.of(schedule));

        ScheduleGetRes res = scheduleService.getSchedules(req.getTherapistId(), req.getStartDate(), req.getEndDate());
        List<DayTimeReq> times = res.getDayTimes();
        assertEquals(2, times.size());
        assertTrue(times.stream().anyMatch(t -> t.getDay().equals(DayType.MONDAY) && t.getTime().equals(10)));
        assertTrue(times.stream().anyMatch(t -> t.getDay().equals(DayType.TUESDAY) && t.getTime().equals(11)));
    }

    @Test
    void requestSchedule_TherapistNotFound_ThrowsException() {
        long therapistId = 1L;
        when(memberRepository.findById(therapistId)).thenReturn(Optional.empty());

        SchedulePostReq postReq = new SchedulePostReq();
        postReq.setTherapistId(therapistId);
        postReq.setStartDate(LocalDate.now());
        postReq.setEndDate(LocalDate.now());
        postReq.setDayTimes(List.of(new DayTimeReq(DayType.WEDNESDAY, 12)));

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> scheduleService.requestSchedule(requester, postReq));
        assertEquals("치료사를 찾지 못하였습니다.", ex.getMessage());
    }

    @Test
    void requestSchedule_Success_SavesSchedule() {
        long therapistId = 1L;
        when(memberRepository.findById(therapistId)).thenReturn(Optional.of(therapist));

        SchedulePostReq postReq = new SchedulePostReq();
        postReq.setTherapistId(therapistId);
        postReq.setStartDate(LocalDate.of(2025, 8, 5));
        postReq.setEndDate(LocalDate.of(2025, 8, 10));
        postReq.setDayTimes(List.of(new DayTimeReq(DayType.WEDNESDAY, 12)));

        scheduleService.requestSchedule(requester, postReq);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());

        Schedule saved = captor.getValue();
        assertEquals(therapist, saved.getTherapist());
        assertEquals(requester.getMemberId(), saved.getMember().getMemberId());
        assertEquals(StatusType.PENDING, saved.getStatus());
        assertEquals(1, saved.getDayTimes().size());
        assertEquals(DayType.WEDNESDAY, saved.getDayTimes().get(0).getDay());
        assertEquals(12, saved.getDayTimes().get(0).getTime());
    }

    @Test
    void updateStatus_ScheduleNotFound_ThrowsException() {
        long scheduleId = 100L;
        when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.empty());

        ScheduleUpdateReq updateReq = new ScheduleUpdateReq();
        updateReq.setScheduleId(scheduleId);
        updateReq.setStatus(StatusType.ACCEPTED);

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> scheduleService.updateStatus(requester, updateReq));
        assertEquals("해당 스케줄이 존재하지 않습니다.", ex.getMessage());
    }

    @Test
    void updateStatus_NotTherapist_ThrowsAccessDenied() {
        Schedule schedule = Schedule.builder()
                .therapist(therapist)
                .status(StatusType.PENDING)
                .build();
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));

        ScheduleUpdateReq updateReq = new ScheduleUpdateReq();
        updateReq.setScheduleId(1L);
        updateReq.setStatus(StatusType.ACCEPTED);

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> scheduleService.updateStatus(requester, updateReq));
        assertEquals("해당 스케줄에 대한 권한이 없습니다.", ex.getMessage());
    }

    @Test
    void updateStatus_AlreadyProcessed_ThrowsException() {
        Schedule schedule = Schedule.builder()
                .therapist(therapist)
                .status(StatusType.ACCEPTED)
                .build();
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));

        ScheduleUpdateReq updateReq = new ScheduleUpdateReq();
        updateReq.setScheduleId(1L);
        updateReq.setStatus(StatusType.REJECTED);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> scheduleService.updateStatus(therapist, updateReq));
        assertEquals("이미 처리된 스케줄입니다.", ex.getMessage());
    }

    @Test
    void updateStatus_Success_UpdatesStatus() {
        Schedule schedule = Schedule.builder()
                .therapist(therapist)
                .status(StatusType.PENDING)
                .build();
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));

        ScheduleUpdateReq updateReq = new ScheduleUpdateReq();
        updateReq.setScheduleId(1L);
        updateReq.setStatus(StatusType.ACCEPTED);

        scheduleService.updateStatus(therapist, updateReq);

        assertEquals(StatusType.ACCEPTED, schedule.getStatus());
    }
}
