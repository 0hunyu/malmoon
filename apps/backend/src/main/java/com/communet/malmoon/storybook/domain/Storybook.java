package com.communet.malmoon.storybook.domain;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Storybook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 동화책 id

    private String title; // 책제목
    private String author; // 작가
    private String isbn; // isbn
    private int publishedYear; // 출판년도
    private String publisher; // 출판사
    private String classification; // 장르
}
