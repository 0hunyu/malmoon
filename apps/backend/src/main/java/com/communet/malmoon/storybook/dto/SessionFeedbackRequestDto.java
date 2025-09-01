package com.communet.malmoon.storybook.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SessionFeedbackRequestDto {
    private Long childId;
    private LocalDate date;
    private int lastPage;
    private String storybookTitle;
}
