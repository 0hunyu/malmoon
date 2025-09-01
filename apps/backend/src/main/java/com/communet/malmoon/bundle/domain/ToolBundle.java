package com.communet.malmoon.bundle.domain;

import com.communet.malmoon.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tool_bundle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolBundle extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long toolBundleId;

    @Column(name = "aac_set_id")
    private Long aacSetId;

    @Column(name = "filter_set_id")
    private Long filterSetId;

    @Column(name = "therapist_id", nullable = false)
    private Long therapistId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", nullable = false)
    private String description;
}
