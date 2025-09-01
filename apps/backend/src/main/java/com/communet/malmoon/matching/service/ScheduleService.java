package com.communet.malmoon.matching.service;

import com.communet.malmoon.diagnostic.domain.InitialTestAttempt;
import com.communet.malmoon.diagnostic.domain.InitialTestResult;
import com.communet.malmoon.diagnostic.repository.InitialTestAttemptRepository;
import com.communet.malmoon.diagnostic.repository.InitialTestResultRepository;
import com.communet.malmoon.matching.domain.*;
import com.communet.malmoon.matching.dto.request.DayTimeReq;
import com.communet.malmoon.matching.dto.request.SchedulePostReq;
import com.communet.malmoon.matching.dto.request.ScheduleUpdateReq;
import com.communet.malmoon.matching.dto.response.*;
import com.communet.malmoon.matching.repository.ScheduleRepository;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.domain.MemberType;
import com.communet.malmoon.member.domain.Therapist;
import com.communet.malmoon.member.dto.response.CareerRes;
import com.communet.malmoon.member.dto.response.MemberMeRes;
import com.communet.malmoon.member.repository.MemberRepository;
import com.communet.malmoon.member.repository.TherapistRepository;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final MemberRepository memberRepository;
    private final TherapistRepository therapistRepository;
    private final TreatmentTimeService treatmentTimeService;
    private final ScheduleRepository scheduleRepository;
    private final InitialTestAttemptRepository initialTestAttemptRepository;
    private final InitialTestResultRepository initialTestResultRepository;

    /**
     * 치료사 ID와 기간을 기준으로 겹치는 스케줄 목록을 조회
     * 스케줄 안의 dayTime 리스트를 평탄화(flatMap)하여 모두 반환
     */
    public ScheduleGetRes getSchedules(Long therapistId, LocalDate startDate, LocalDate endDate) {
        if (!memberRepository.existsById(therapistId)) {
            throw new EntityNotFoundException("해당 치료사가 존재하지 않습니다.");
        }

        Map<DayType, List<Integer>> treatmentTimes = treatmentTimeService.getTreatmentTime(therapistId).getTreatmentTimes();

        List<Schedule> schedules =
                scheduleRepository.findAllByTherapist_MemberIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        therapistId,
                        endDate,
                        startDate);

        List<DayTimeReq> busyList = schedules.stream()
                .flatMap(schedule -> schedule.getDayTimes().stream())
                .map(dt -> new DayTimeReq(dt.getDay(), dt.getTime()))
                .toList();

        // DayType 별로 busy 시간을 Set으로 그룹화
        Map<DayType, Set<Integer>> busyMap = busyList.stream()
                .collect(Collectors.groupingBy(
                        DayTimeReq::getDay,
                        Collectors.mapping(DayTimeReq::getTime, Collectors.toSet())
                ));

        List<DayTimeReq> availableList = treatmentTimes.entrySet().stream()
                .flatMap(entry -> {
                    DayType day = entry.getKey();
                    Set<Integer> busy = busyMap.getOrDefault(day, Set.of());
                    return entry.getValue().stream()
                            .filter(hour -> !busy.contains(hour))
                            .map(hour -> new DayTimeReq(day, hour));
                })
                .toList();

        // ScheduleGetRes 에 담아서 반환
        return new ScheduleGetRes(availableList);
    }

    /**
     * 치료 대상자가 치료사에게 스케줄 요청을 보냄
     * 요청에 포함된 요일/시간 리스트를 DayTime 엔티티로 변환해 Schedule에 연결
     */
    public void requestSchedule(Member member, SchedulePostReq schedulePostReq) {
        Optional<Member> memberOptional = memberRepository.findById(schedulePostReq.getTherapistId());

        if (memberOptional.isEmpty()) {
            throw new EntityNotFoundException("치료사를 찾지 못하였습니다.");
        }

        List<DayTime> dayTimes = schedulePostReq.getDayTimes().stream()
                .map(req -> DayTime.builder()
                        .day(req.getDay())
                        .time(req.getTime())
                        .build())
                .toList();

        Schedule schedule = Schedule.builder()
                .startDate(schedulePostReq.getStartDate())
                .endDate(schedulePostReq.getEndDate())
                .therapist(memberOptional.get())
                .member(member)
                .status(StatusType.PENDING)
                .build();

        schedule.addAllDayTimes(dayTimes);

        scheduleRepository.save(schedule);
    }

    /**
     * 치료사가 스케줄 상태(PENDING → ACCEPTED/REJECTED) 변경
     * - 치료사 본인만 해당 스케줄 수정 가능
     * - 이미 처리된 스케줄은 수정 불가
     */
    @Transactional
    public void updateStatus(Member member, ScheduleUpdateReq scheduleUpdateReq) {
        Optional<Schedule> scheduleOptional = scheduleRepository.findById(scheduleUpdateReq.getScheduleId());

        if (scheduleOptional.isEmpty()) {
            throw new EntityNotFoundException("해당 스케줄이 존재하지 않습니다.");
        }
        Schedule schedule = scheduleOptional.get();
        if (!Objects.equals(schedule.getTherapist().getMemberId(), member.getMemberId())) {
            throw new AccessDeniedException("해당 스케줄에 대한 권한이 없습니다.");
        }
        if (schedule.getStatus() != StatusType.PENDING) {
            throw new IllegalStateException("이미 처리된 스케줄입니다.");
        }

        schedule.setStatus(scheduleUpdateReq.getStatus());
    }

    public List<MemberPendingRes> getPendingSchedules(Long therapistId) {

        List<Schedule> schedules = scheduleRepository.findAllByTherapist_MemberIdAndStatus(therapistId, StatusType.PENDING);



        return schedules.stream()
                .map(schedule -> {
                    Member member = schedule.getMember();

                    if (member == null) {
                        return null;
                    }

                    List<InitialTestAttempt> initialTestAttemptList = initialTestAttemptRepository.findByChildId(member.getMemberId());
                    if (initialTestAttemptList.isEmpty()) {
                        return MemberPendingRes.builder()
                                .scheduleId(schedule.getScheduleId())
                                .memberId(member.getMemberId())
                                .name(member.getName())
                                .email(member.getEmail())
                                .telephone(member.getTel1())
                                .createDate(schedule.getCreatedAt())
                                .build();
                    }

                    Optional<InitialTestResult> initialTestResultOptional = initialTestResultRepository.findById(initialTestAttemptList.get(0).getAttemptId());
                    if (initialTestResultOptional.isEmpty()) {
                        return MemberPendingRes.builder()
                                .scheduleId(schedule.getScheduleId())
                                .memberId(member.getMemberId())
                                .name(member.getName())
                                .email(member.getEmail())
                                .telephone(member.getTel1())
                                .createDate(schedule.getCreatedAt())
                                .build();
                    }
                    InitialTestResult initialTestResult = initialTestResultOptional.get();

                    return MemberPendingRes.builder()
                            .scheduleId(schedule.getScheduleId())
                            .memberId(member.getMemberId())
                            .name(member.getName())
                            .email(member.getEmail())
                            .telephone(member.getTel1())
                            .createDate(schedule.getCreatedAt())
                            .evaluation(initialTestResult.getEvaluation())
                            .improvements(initialTestResult.getImprovements())
                            .recommendations(initialTestResult.getRecommendations())
                            .strengths(initialTestResult.getStrengths())
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }

    // 윤지훈: 사용자와 이미 연결된 치료사를 제외하고 반환하도록 로직 수정
    @Transactional(readOnly = true)
    public List<TherapistRes> getTherapists(Member member) {
        // 1) 제외할 therapist id 집합 조회
        Set<Long> excludedTherapistIds = scheduleRepository.findTherapistIdsByMemberAndStatuses(
                member.getMemberId(),
                List.of(StatusType.PENDING, StatusType.ACCEPTED)
        );

        if (excludedTherapistIds == null) {
            excludedTherapistIds = Collections.emptySet();
        }

        // 2) excludedIds가 비어있으면 별도 메서드 호출 (IN 빈 컬렉션 회피)
        List<Therapist> therapists;
        if (excludedTherapistIds.isEmpty()) {
            therapists = therapistRepository.findAllByMember_role(MemberType.ROLE_THERAPIST);
        } else {
            therapists = therapistRepository.findAllByMember_roleAndMember_MemberIdNotIn(
                    MemberType.ROLE_THERAPIST,
                    excludedTherapistIds
            );
        }

        // 3) DTO 매핑 — therapist.getMember()로 Member 정보 사용
        return therapists.stream()
                .map(therapist -> {
                    Member therapistMember = therapist.getMember(); // 1:1 매핑된 Member
                    List<CareerRes> careerResList = therapist.getCareers().stream()
                            .map(career -> CareerRes.builder()
                                    .company(career.getCompany())
                                    .position(career.getPosition())
                                    .startDate(career.getStartDate())
                                    .endDate(career.getEndDate())
                                    .build())
                            .toList();

                    return new TherapistRes(
                            therapistMember.getMemberId(),
                            therapistMember.getName(),
                            therapistMember.getEmail(),
                            therapistMember.getTel1(),
                            therapistMember.getBirthDate(),
                            therapistMember.getProfile(),
                            therapist.getCareerYears(),
                            careerResList
                    );
                })
                .toList();
    }

    public List<MyTherapistScheduleRes> getMyTherapists(Member member, StatusType status) {
        List<Schedule> schedules;
        if (status == StatusType.ACCEPTED) {
            schedules = scheduleRepository.findByMemberAndStatus(member, status);
        } else {
            schedules = scheduleRepository.findByMemberAndStatus(member, status);
            schedules.addAll(scheduleRepository.findByMemberAndStatus(member, StatusType.REJECTED));
        }

        return schedules.stream()
                .map(schedule -> {
                    Member therapistMember = schedule.getTherapist();

                    // Therapist -> CareerRes 리스트
                    Therapist therapist = therapistRepository.findById(therapistMember.getMemberId()).get();

                    List<CareerRes> careerResList = therapist.getCareers().stream()
                            .map(career -> CareerRes.builder()
                                    .company(career.getCompany())
                                    .position(career.getPosition())
                                    .startDate(career.getStartDate())
                                    .endDate(career.getEndDate())
                                    .build()
                            )
                            .toList();

                    Long actualTherapistId = therapist.getTherapistId();
                    System.out.println("DEBUG: therapist.getTherapistId() = " + actualTherapistId + " for member ID " + therapistMember.getMemberId()); // Add logging

                    TherapistRes therapistRes = new TherapistRes(
                            actualTherapistId, // Use therapist.getTherapistId() directly
                            therapistMember.getName(),
                            therapistMember.getEmail(),
                            therapistMember.getTel1(),
                            therapistMember.getBirthDate(),
                            therapistMember.getProfile(),
                            therapist.getCareerYears(),
                            careerResList
                    );

                    // DayTime → DayTimeRes
                    List<DayTimeRes> dayTimeResList = schedule.getDayTimes().stream()
                            .map(dt -> new DayTimeRes(dt.getDay(), dt.getTime()))
                            .toList();

                    return new MyTherapistScheduleRes(
                            schedule.getScheduleId(),
                            schedule.getStartDate(),
                            schedule.getEndDate(),
                            dayTimeResList,
                            therapistRes
                    );
                })
                .toList();
    }

    public void deleteSchedule(Member member, Long scheduleId) {
        scheduleRepository.deleteByScheduleIdAndMember(scheduleId, member);
    }

    public List<MemberScheduleRes> getMemberSchedules(Long memberId) {
        LocalDate today = LocalDate.now();
        DayOfWeek dayOfWeek = today.getDayOfWeek();
        String day = dayOfWeek.toString();
        List<Schedule> schedules = scheduleRepository.findAcceptedSchedulesByMemberIdAndDate(
                memberId, StatusType.ACCEPTED, today
        );

        return schedules.stream()
                .flatMap(schedule ->
                        schedule.getDayTimes().stream()
                                .filter(dt -> dt.getDay().toString().equals(day))
                                .map(dt -> new MemberScheduleRes(
                                        schedule.getTherapist().getMemberId(),
                                        schedule.getTherapist().getName(),
                                        dt.getTime()
                                ))
                )
                .toList();
    }

    public List<TherapistScheduleRes> getTherapistSchedules(Long therapistId, LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        String day = dayOfWeek.toString();
        List<Schedule> schedules = scheduleRepository.findAcceptedSchedulesByTherapistIdAndDate(
                therapistId, StatusType.ACCEPTED, date
        );

        return schedules.stream()
                .filter(schedule -> schedule.getMember() != null && schedule.getMember().getMemberId() != null) // 윤지훈: member 및 memberId가 null이 아닌 경우만 필터링
                .flatMap(schedule ->
                        schedule.getDayTimes().stream()
                                .filter(dt -> dt.getDay().toString().equals(day))
                                .map(dt -> {
                                    return new TherapistScheduleRes(
                                            schedule.getMember().getMemberId(),
                                            schedule.getMember().getName(),
                                            dt.getTime()
                                    );
                                })
                )
                .toList();
    }

    public ClientTherapistRes getClientTherapist(Member member) {
        List<Schedule> schedules = scheduleRepository.findByMemberAndStatus(member, StatusType.ACCEPTED);

        Member therapist = schedules.get(0).getTherapist();

        return ClientTherapistRes.builder()
                .therapistId(therapist.getMemberId())
                .name(therapist.getName())
                .email(therapist.getEmail())
                .age(Period.between(therapist.getBirthDate(), LocalDate.now()).getYears())
                .telephone(therapist.getTel1())
                .build();
    }

    public List<TherapistClientRes> getTherapistClients(Member member) {
        List<Schedule> schedules = scheduleRepository.findByTherapistAndStatus(member, StatusType.ACCEPTED);

        return schedules.stream()
                .map(Schedule::getMember)
                .filter(Objects::nonNull)
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(Member::getMemberId, m -> m, (m1, m2) -> m1),
                        map -> map.values().stream()
                                .map(m -> TherapistClientRes.builder()
                                        .clientId(m.getMemberId())
                                        .name(m.getName())
                                        .email(m.getEmail())
                                        .age(Period.between(m.getBirthDate(), LocalDate.now()).getYears())
                                        .telephone(m.getTel1())
                                        .build())
                                .collect(Collectors.toList())
                ));
    }

    public MemberMeRes getClientDetail(Long clientId) {
        Member member = memberRepository.findById(clientId).orElseThrow(EntityNotFoundException::new);

        return MemberMeRes.builder()
                .email(member.getEmail())
                .name(member.getName())
                .nickname(member.getNickname())
                .birthDate(member.getBirthDate())
                .tel1(member.getTel1())
                .tel2(member.getTel2())
                .city(member.getAddress().getCity())
                .district(member.getAddress().getDistrict())
                .dong(member.getAddress().getDong())
                .detail(member.getAddress().getDetail())
                .profile(member.getProfile())
                .build();
    }
}
