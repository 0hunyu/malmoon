package com.communet.malmoon.filter.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class FilterListRes {
    List<FilterDto> filters;
    public FilterListRes(List<FilterDto> filters) {
        this.filters = filters;
    }
}
