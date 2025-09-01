package com.communet.malmoon.matching.service;

import com.communet.malmoon.matching.domain.DayType;
import com.communet.malmoon.matching.domain.TreatmentTime;
import com.communet.malmoon.matching.dto.request.TreatmentTimeReq;
import com.communet.malmoon.matching.dto.response.TreatmentTimeRes;
import com.communet.malmoon.matching.repository.TreatmentTimeRepository;
import com.communet.malmoon.member.domain.Therapist;
import com.communet.malmoon.member.repository.TherapistRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TreatmentTimeService {

    private final TherapistRepository therapistRepository;
    private final TreatmentTimeRepository treatmentTimeRepository;

    public TreatmentTimeRes getTreatmentTime(Long therapistId) {
        Therapist therapist = therapistRepository.findByTherapistId(therapistId)
                .orElseThrow(() -> new EntityNotFoundException("치료사를 찾을 수 없습니다."));

        List<TreatmentTime> times = therapist.getTreatmentTimes();

        Map<DayType, List<Integer>> groupedByDay = times.stream()
                .collect(Collectors.groupingBy(
                        TreatmentTime::getDay,
                        Collectors.mapping(TreatmentTime::getTime, Collectors.toList())
                ));

        return new TreatmentTimeRes(groupedByDay);
    }

        @Transactional
    public void createTreatmentTime(Long memberId, TreatmentTimeReq req) {
        Therapist therapist = therapistRepository.findByTherapistId(memberId)
                .orElseThrow(() -> new EntityNotFoundException("치료사를 찾을 수 없습니다."));

        if (!therapist.getTreatmentTimes().isEmpty()) {
            throw new RuntimeException("이미 저장된 치료 시간이 존재합니다.");
        }

        List<TreatmentTime> treatmentTimes = reqToTreatmentTimes(req, therapist);

        treatmentTimeRepository.saveAll(treatmentTimes);
    }

    @Transactional
    public void updateTreatmentTimes(Long memberId, TreatmentTimeReq req) {
        Therapist therapist = therapistRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Therapist not found"));

        // 기존 데이터 모두 삭제
        treatmentTimeRepository.deleteByTherapist(therapist);

        // 새로운 데이터 저장
        List<TreatmentTime> newTreatmentTimes = reqToTreatmentTimes(req, therapist);

        treatmentTimeRepository.saveAll(newTreatmentTimes);
    }

    private List<TreatmentTime> reqToTreatmentTimes(TreatmentTimeReq req, Therapist therapist) {
        return req.getTreatmentTimes().entrySet().stream()
                .flatMap(entry -> {
                    DayType day = entry.getKey();
                    return entry.getValue().stream()
                            .map(time -> TreatmentTime.builder()
                                    .day(day)
                                    .time(time)
                                    .therapist(therapist)
                                    .build());
                })
                .collect(Collectors.toList());
    }
}
