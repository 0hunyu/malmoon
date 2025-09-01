package com.communet.malmoon.filter.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "filter_set_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FilterSetInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long filterSetInfoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filter_set_filter_set_id")
    private FilterSet filterSet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filter_filter_id")
    private Filter filter;
}
