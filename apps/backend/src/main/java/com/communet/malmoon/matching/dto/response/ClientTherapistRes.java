package com.communet.malmoon.matching.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClientTherapistRes {
    private Long therapistId;
    private String name;
    private String email;
    private Integer age;
    private String telephone;
}
