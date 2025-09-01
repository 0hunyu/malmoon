package com.communet.malmoon.session.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SessionTokenRes {
    private String token;
    private Long chatRoomId; // 여기 추가함
}
