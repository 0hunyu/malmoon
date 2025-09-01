package com.communet.malmoon.matching.dto.request;

import com.communet.malmoon.matching.domain.DayType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentTimeReq {
    private Map<DayType, List<Integer>> treatmentTimes;
}
