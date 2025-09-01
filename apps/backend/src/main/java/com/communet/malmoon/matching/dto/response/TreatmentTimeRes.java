package com.communet.malmoon.matching.dto.response;

import com.communet.malmoon.matching.domain.DayType;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TreatmentTimeRes {
    private Map<DayType, List<Integer>> treatmentTimes;
    public TreatmentTimeRes(Map<DayType, List<Integer>> treatmentTimes) {
        this.treatmentTimes = treatmentTimes;
    }
}
