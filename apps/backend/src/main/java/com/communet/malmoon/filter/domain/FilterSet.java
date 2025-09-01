package com.communet.malmoon.filter.domain;

import com.communet.malmoon.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "filter_set")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FilterSet extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long filterSetId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "therapist_id", nullable = false)
    private Long therapistId;

    @Column(name = "description", nullable = false)
    private String description;

    @OneToMany(mappedBy = "filterSet", cascade = CascadeType.ALL)
    @Builder.Default
    private List<FilterSetInfo> filterSetInfos = new ArrayList<>();

    public void addFilter(Filter filter) {
        FilterSetInfo info = FilterSetInfo.builder()
                .filterSet(this)
                .filter(filter)
                .build();
        this.filterSetInfos.add(info);
        filter.getFilterSetInfos().add(info);
    }
}
