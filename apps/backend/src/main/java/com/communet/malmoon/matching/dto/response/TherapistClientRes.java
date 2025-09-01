package com.communet.malmoon.matching.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TherapistClientRes {
    private Long clientId;
    private String name;
    private String email;
    private Integer age;
    private String telephone;
}
