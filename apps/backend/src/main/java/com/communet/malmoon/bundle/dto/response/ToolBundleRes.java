package com.communet.malmoon.bundle.dto.response;

import com.communet.malmoon.bundle.domain.ToolBundle;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolBundleRes {
    private Long toolBundleId;
    private Long aacSetId;
    private Long filterSetId;
    private String name;
    private String description;

    public static ToolBundleRes fromEntity(ToolBundle entity) {
        return ToolBundleRes.builder()
                .toolBundleId(entity.getToolBundleId())
                .aacSetId(entity.getAacSetId())
                .filterSetId(entity.getFilterSetId())
                .name(entity.getName())
                .description(entity.getDescription())
                .build();
    }
}
