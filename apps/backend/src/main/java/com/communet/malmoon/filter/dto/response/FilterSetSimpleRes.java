package com.communet.malmoon.filter.dto.response;

import com.communet.malmoon.filter.domain.FilterSet;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FilterSetSimpleRes {
    private Long filterSetId;
    private String name;
    private String description;

    public static FilterSetSimpleRes from(FilterSet filterSet) {
        return FilterSetSimpleRes.builder()
                .filterSetId(filterSet.getFilterSetId())
                .name(filterSet.getName())
                .description(filterSet.getDescription())
                .build();
    }
}
