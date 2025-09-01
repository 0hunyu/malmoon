package com.communet.malmoon.matching.dto.request;

import com.communet.malmoon.matching.domain.StatusType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleUpdateReq {
    @NotNull(message = "스케줄 ID는 필수입니다.")
    private Long scheduleId;
    @NotNull(message = "상태 값은 필수입니다.")
    private StatusType status;
}
