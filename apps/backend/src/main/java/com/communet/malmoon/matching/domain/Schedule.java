package com.communet.malmoon.matching.domain;

import com.communet.malmoon.common.entity.BaseEntity;
import com.communet.malmoon.member.domain.Member;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Schedule extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scheduleId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private StatusType status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapist_id")
    @JsonIgnore
    private Member therapist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    @JsonIgnore
    private Member member;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL)
    @Builder.Default
    private List<DayTime> dayTimes = new ArrayList<>();

    public void addDayTime(DayTime dayTime) {
        this.dayTimes.add(dayTime);
        dayTime.setSchedule(this);
    }

    public void addAllDayTimes(List<DayTime> dayTimes) {
        for (DayTime dt : dayTimes) {
            addDayTime(dt);
        }
    }
}
