package com.communet.malmoon.matching.controller;

import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.matching.dto.request.TreatmentTimeReq;
import com.communet.malmoon.matching.dto.response.TreatmentTimeRes;
import com.communet.malmoon.matching.service.TreatmentTimeService;
import com.communet.malmoon.member.domain.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/treatment-time")
@RequiredArgsConstructor
public class TreatmentTimeController {

    private final TreatmentTimeService treatmentTimeService;

    @GetMapping
    public ResponseEntity<TreatmentTimeRes> getTreatmentTime(@RequestParam Long therapistId) {
        return ResponseEntity.ok(treatmentTimeService.getTreatmentTime(therapistId));
    }

    @PostMapping
    public ResponseEntity<?> createTreatmentTime(
            @CurrentMember Member member,
            @RequestBody TreatmentTimeReq treatmentTimes) {
        treatmentTimeService.createTreatmentTime(member.getMemberId(), treatmentTimes);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping
    public ResponseEntity<?> updateTreatmentTime(
            @CurrentMember Member member,
            @RequestBody TreatmentTimeReq treatmentTimes) {
        treatmentTimeService.updateTreatmentTimes(member.getMemberId(), treatmentTimes);
        return ResponseEntity.ok().build();

    }
}
