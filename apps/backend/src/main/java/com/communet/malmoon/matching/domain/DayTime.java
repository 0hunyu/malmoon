package com.communet.malmoon.matching.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "day_time")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DayTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long DayTimeId;

    @Column(name = "day", nullable = false)
    @Enumerated(EnumType.STRING)
    private DayType day;

    @Column(name = "time", nullable = false)
    private Integer time;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    @JsonIgnore
    private Schedule schedule;
}
