package com.communet.malmoon.filter.dto.response;

import lombok.Data;

@Data
public class FilterDto {
    private Long filterId;
    private String name;
    private String filterLensId;
    private String fileUrl;
}
