package com.communet.malmoon.filter.dto.response;

import com.communet.malmoon.filter.domain.Filter;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FilterSetDetailRes {
    private Long filterId;
    private String name;
    private String filterLensId;
    private Long fileId;

    public static FilterSetDetailRes from(Filter filter) {
        return FilterSetDetailRes.builder()
                .filterId(filter.getFilterId())
                .name(filter.getName())
                .filterLensId(filter.getFilterLensId())
                .fileId(filter.getFileId())
                .build();
    }
}
