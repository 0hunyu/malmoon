package com.communet.malmoon.bundle.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolBundleCreateReq {
    private Long aacSetId;
    private Long filterSetId;
    private String name;
    private String description;
}
