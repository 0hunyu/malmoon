package com.communet.malmoon.filter.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilterSetUpdateReq {
    private String name;
    private String description;
    private List<Long> filterIds;
}
