package com.communet.malmoon.member.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "address")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id", nullable = false, updatable = false)
    private Long addressId;

    @Column(name = "city", columnDefinition = "varchar(10)",  nullable = false)
    private String city;

    @Column(name = "district", columnDefinition = "varchar(10)",  nullable = false)
    private String district;

    @Column(name = "dong", columnDefinition = "varchar(10)",  nullable = false)
    private String dong;

    @Column(name = "detail", columnDefinition = "varchar(30)")
    private String detail;
}
