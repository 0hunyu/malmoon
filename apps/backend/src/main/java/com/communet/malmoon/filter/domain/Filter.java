package com.communet.malmoon.filter.domain;

import com.communet.malmoon.common.entity.BaseEntity;
import com.communet.malmoon.member.domain.Member;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Filter")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Filter extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long filterId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "filter_lens_id")
    private String filterLensId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner")
    private Member owner;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private FilterStatusType status;

    @Column(name = "file_id", nullable = false)
    private Long fileId;

    @OneToMany(mappedBy = "filter", cascade = CascadeType.ALL)
    @Builder.Default
    private List<FilterSetInfo> filterSetInfos = new ArrayList<>();
}
