package com.communet.malmoon.storybook.dto;

import lombok.Getter;

import java.util.List;

/**
 * JSON 입력을 받기 위한 DTO
 */
@Getter
public class StorybookRequestDto {

    private String title;
    private String author;
    private String illustrator;
    private String isbn;
    private String readAge;
    private int publishedYear;
    private String publisher;
    private String classification;
    private int paragraphInfoCount;
    private List<ParagraphInfo> paragraphInfo;

    @Getter
    public static class ParagraphInfo {
        private String srcTextID;
        private String srcText;
        private int srcPage;
        private int srcSentenceEA;
        private int srcWordEA;
    }
}
