package com.communet.malmoon.matching.domain;

import com.communet.malmoon.member.domain.Therapist;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "treatment_time")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TreatmentTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long treatmentTimeId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "day")
    private DayType day;

    @Column(name = "time")
    private Integer time;

    @ManyToOne
    @JoinColumn(name = "therapist_id")
    private Therapist therapist;
}
