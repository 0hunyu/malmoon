package com.communet.malmoon.session.controller;

import com.communet.malmoon.common.auth.CurrentMember;
import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.session.dto.request.SessionRoomReq;
import com.communet.malmoon.session.dto.response.SessionTokenRes;
import com.communet.malmoon.session.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * 치료사가 세션 방을 생성할 때 호출
     * @param req 클라이언트 ID를 포함한 요청 객체
     * @param member 현재 로그인한 치료사 정보
     * @return 세션 토큰 응답
     */
    @PostMapping("/room")
    @PreAuthorize("hasRole('ROLE_THERAPIST')")
    public ResponseEntity<SessionTokenRes> createRoom(@RequestBody SessionRoomReq req, @CurrentMember Member member) {
        SessionTokenRes sessionTokenRes = sessionService.storeRoomInfo(member, req.getClientId()); // 여기 수정함
        return ResponseEntity.ok(sessionTokenRes); // 여기 수정함
    }

    /**
     * 치료사가 세션 방을 삭제할 때 호출
     * @param member 현재 로그인한 치료사 정보
     * @return HTTP 200 OK 응답
     */
    @DeleteMapping("/room")
    @PreAuthorize("hasRole('ROLE_THERAPIST')")
    public ResponseEntity<?> deleteRoom(@CurrentMember Member member) {
        sessionService.deleteRoomInfo(member.getEmail());
        return ResponseEntity.ok().build();
    }

    /**
     * 클라이언트가 세션 방에 참여할 때 호출
     * @param member 현재 로그인한 클라이언트 정보
     * @return 세션 토큰 응답
     */
    @PostMapping("/join")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public ResponseEntity<SessionTokenRes> joinRoom(@CurrentMember Member member) {
        SessionTokenRes sessionTokenRes = sessionService.getJoinRoomName(member); // 여기 수정함
        return ResponseEntity.ok(sessionTokenRes); // 여기 수정함
    }

    /**
     * LiveKit Webhook 이벤트 수신
     * @param authHeader 인증 헤더
     * @param body 이벤트 바디 (JSON)
     * @return 응답 문자열
     */
    @PostMapping(value = "/livekit/webhook", consumes = "application/webhook+json")
    public ResponseEntity<String> receiveWebhook(@RequestHeader("Authorization") String authHeader, @RequestBody String body) {
        sessionService.getWebhookReceiver(authHeader, body);
        return ResponseEntity.ok("ok");
    }
}
