package com.communet.malmoon.matching.controller;

import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.matching.domain.StatusType;
import com.communet.malmoon.matching.dto.request.ScheduleGetReq;
import com.communet.malmoon.matching.dto.request.SchedulePostReq;
import com.communet.malmoon.matching.dto.request.ScheduleUpdateReq;
import com.communet.malmoon.matching.dto.response.*;
import com.communet.malmoon.matching.service.ScheduleService;
import com.communet.malmoon.member.domain.Member;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    // [GET] 치료사의 스케줄 조회 (요청: 치료사 ID, 기간)
    // -> 클라이언트(치료대상자)가 특정 치료사의 스케줄(불가능한 요일/시간)을 조회할 때 사용
    @GetMapping
    public ResponseEntity<ScheduleGetRes> getSchedule(
            @RequestParam Long therapistId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return ResponseEntity.ok().body(scheduleService.getSchedules(therapistId, startDate, endDate));
    }

    // [POST] 치료 대상자 → 치료사에게 스케줄 요청
    // 치료 대상자(`@CurrentMember`)가 원하는 날짜, 요일, 시간을 포함한 스케줄을 요청함
    @PostMapping
    public ResponseEntity<?> requestSchedule(
            @CurrentMember Member member,
            @RequestBody SchedulePostReq schedulePostReq) {
        scheduleService.requestSchedule(member, schedulePostReq);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // [PATCH] 치료사가 스케줄 요청 수락/거절
    // 치료사(`@CurrentMember`)가 받은 스케줄 요청을 ACCEPTED 또는 REJECTED 로 변경함
    @PatchMapping
    @PreAuthorize("hasRole('ROLE_THERAPIST')")
    public ResponseEntity<?> patchSchedule(
            @CurrentMember Member member,
            @RequestBody @Valid ScheduleUpdateReq scheduleUpdateReq) {
        scheduleService.updateStatus(member, scheduleUpdateReq);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ROLE_THERAPIST')")
    public ResponseEntity<List<MemberPendingRes>> getPendingSchedules(@CurrentMember Member member) {
        return ResponseEntity.ok(scheduleService.getPendingSchedules(member.getMemberId()));
    }

        @GetMapping("/therapist")
    public ResponseEntity<List<TherapistRes>> getTherapists(@CurrentMember Member member) {
        return ResponseEntity.ok(scheduleService.getTherapists(member));
    }

    @GetMapping("/me/therapist/accepted")
    public ResponseEntity<List<MyTherapistScheduleRes>> getMyTherapistsAccepted(@CurrentMember Member member) {
        return ResponseEntity.ok(scheduleService.getMyTherapists(member, StatusType.ACCEPTED));
    }

    @GetMapping("/me/therapist/not-accepted")
    public ResponseEntity<List<MyTherapistScheduleRes>> getMyTherapistsNotAccepted(@CurrentMember Member member) {
        return ResponseEntity.ok(scheduleService.getMyTherapists(member, StatusType.PENDING));
    }

    @DeleteMapping("/me/therapist")
    public ResponseEntity<?> deleteSchedule(
            @CurrentMember Member member,
            @RequestParam Long scheduleId) {
        scheduleService.deleteSchedule(member, scheduleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/today")
    public ResponseEntity<List<MemberScheduleRes>> getMemberSchedules(@CurrentMember Member member) {
        return ResponseEntity.ok(scheduleService.getMemberSchedules(member.getMemberId()));
    }

    @GetMapping("/therapist/date")
    @PreAuthorize("hasRole('ROLE_THERAPIST')")
    public ResponseEntity<List<TherapistScheduleRes>> getTherapistSchedule(
            @CurrentMember Member member,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(scheduleService.getTherapistSchedules(member.getMemberId(), date));
    }

    @GetMapping("/client/therapist")
    public ResponseEntity<?> getClientTherapist(@CurrentMember Member member) {
        return ResponseEntity.ok(scheduleService.getClientTherapist(member));
    }

    // 치료사에 해당되는 치료 아동
    @GetMapping("/therapist/client")
    @PreAuthorize("hasRole('ROLE_THERAPIST')")
    public ResponseEntity<?> getTherapistClients(@CurrentMember Member member) {
        return ResponseEntity.ok(scheduleService.getTherapistClients(member));
    }

    @GetMapping("/therapist/client/detail")
    @PreAuthorize("hasRole('ROLE_THERAPIST')")
    public ResponseEntity<?> getClientDetail(@RequestParam Long clientId) {
        return ResponseEntity.ok(scheduleService.getClientDetail(clientId));
    }
}
