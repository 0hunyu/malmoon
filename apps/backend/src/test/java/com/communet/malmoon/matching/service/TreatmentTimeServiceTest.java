package com.communet.malmoon.matching.service;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.communet.malmoon.matching.domain.DayType;
import com.communet.malmoon.matching.domain.TreatmentTime;
import com.communet.malmoon.matching.dto.request.TreatmentTimeReq;
import com.communet.malmoon.matching.dto.response.TreatmentTimeRes;
import com.communet.malmoon.matching.repository.TreatmentTimeRepository;
import com.communet.malmoon.member.domain.Therapist;
import com.communet.malmoon.member.repository.TherapistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import java.util.*;

class TreatmentTimeServiceTest {

    @Mock
    private TherapistRepository therapistRepository;

    @Mock
    private TreatmentTimeRepository treatmentTimeRepository;

    @InjectMocks
    private TreatmentTimeService treatmentTimeService;

    private Therapist therapist;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        therapist = Therapist.builder()
                .therapistId(1L)
                .treatmentTimes(new ArrayList<>())
                .build();
    }

    @Test
    void testGetTreatmentTime() {
        // given
        TreatmentTime time1 = TreatmentTime.builder()
                .day(DayType.MONDAY)
                .time(900)
                .therapist(therapist)
                .build();
        TreatmentTime time2 = TreatmentTime.builder()
                .day(DayType.MONDAY)
                .time(1300)
                .therapist(therapist)
                .build();
        TreatmentTime time3 = TreatmentTime.builder()
                .day(DayType.TUESDAY)
                .time(1000)
                .therapist(therapist)
                .build();

        therapist.getTreatmentTimes().addAll(Arrays.asList(time1, time2, time3));

        when(therapistRepository.findByTherapistId(1L)).thenReturn(Optional.of(therapist));

        // when
        TreatmentTimeRes res = treatmentTimeService.getTreatmentTime(1L);

        // then
        Map<DayType, List<Integer>> grouped = res.getTreatmentTimes();
        assertEquals(2, grouped.size());
        assertEquals(Arrays.asList(900, 1300), grouped.get(DayType.MONDAY));
        assertEquals(Collections.singletonList(1000), grouped.get(DayType.TUESDAY));
    }

    @Test
    void testCreateTreatmentTime_whenAlreadyExists() {
        // 기존 데이터가 이미 있을 때 예외가 발생하는지 테스트
        therapist.getTreatmentTimes().add(
                TreatmentTime.builder().day(DayType.MONDAY).time(900).therapist(therapist).build()
        );

        when(therapistRepository.findByTherapistId(1L)).thenReturn(Optional.of(therapist));

        TreatmentTimeReq req = new TreatmentTimeReq(Map.of(
                DayType.MONDAY, List.of(900, 1300)
        ));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> treatmentTimeService.createTreatmentTime(1L, req));

        assertEquals("이미 저장된 치료 시간이 존재합니다.", exception.getMessage());
        verify(treatmentTimeRepository, never()).saveAll(anyList());
    }

    @Test
    void testCreateTreatmentTime_success() {
        when(therapistRepository.findByTherapistId(1L)).thenReturn(Optional.of(therapist));

        TreatmentTimeReq req = new TreatmentTimeReq(Map.of(
                DayType.MONDAY, List.of(900, 1300),
                DayType.TUESDAY, List.of(1000)
        ));

        treatmentTimeService.createTreatmentTime(1L, req);

        // saveAll이 호출됐는지 확인
        verify(treatmentTimeRepository, times(1)).saveAll(anyList());
    }

    @Test
    void testUpdateTreatmentTimes() {
        when(therapistRepository.findById(1L)).thenReturn(Optional.of(therapist));

        TreatmentTimeReq req = new TreatmentTimeReq(Map.of(
                DayType.WEDNESDAY, List.of(1100)
        ));

        treatmentTimeService.updateTreatmentTimes(1L, req);

        // 기존 데이터 삭제 및 새로 저장했는지 확인
        verify(treatmentTimeRepository, times(1)).deleteByTherapist(therapist);
        verify(treatmentTimeRepository, times(1)).saveAll(anyList());
    }
}
