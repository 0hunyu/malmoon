package com.communet.malmoon.chat.service;

import java.util.List;

import com.communet.malmoon.chat.dto.request.ChatRoomCreateReq;
import com.communet.malmoon.chat.dto.response.ChatParticipantRes;
import com.communet.malmoon.chat.dto.response.ChatRoomCreateRes;
import com.communet.malmoon.chat.dto.response.ChatRoomSummaryRes;
import com.communet.malmoon.member.domain.Member;

/**
 * 채팅방 관련 서비스 인터페이스입니다.
 * 채팅방 생성, 조회, 종료 등 채팅방 관리에 필요한 기능을 정의합니다.
 */
public interface ChatRoomService {

	/**
	 * 채팅방을 생성하거나 기존 채팅방을 조회합니다.
	 *
	 * @param request   채팅방 생성 요청 객체
	 * @param currentId 현재 로그인한 사용자의 ID
	 * @return 생성되었거나 기존에 존재하던 채팅방의 정보
	 */
	ChatRoomCreateRes createOrGetRoom(ChatRoomCreateReq request, Long currentId);

	/**
	 * 세션 채팅방을 종료 처리합니다.
	 *
	 * @param chatRoomId 종료할 채팅방의 ID
	 */
	void deleteSessionRoom(Long chatRoomId);

	/**
	 * 채팅방 이름을 자동으로 생성합니다.
	 *
	 * @param request   채팅방 생성 요청 객체
	 * @param memberId  현재 로그인한 사용자 ID (본인 제외 목적)
	 * @return 자동 생성된 채팅방 이름
	 */
	String generateRoomName(ChatRoomCreateReq request, Long memberId);

	/**
	 * 사용자가 참여 중인 모든 채팅방 목록을 조회합니다.
	 *
	 * @param memberId 사용자 ID
	 * @return 채팅방 목록 응답 객체 리스트
	 */
	List<ChatRoomSummaryRes> getMyChatRooms(Long memberId);

	/**
	 * 채팅방 이름을 수정합니다.
	 *
	 * @param roomId 수정할 채팅방 ID
	 * @param memberId 요청자 ID (권한 체크용)
	 * @param newName 새 채팅방 이름
	 */
	void updateRoomName(Long roomId, Long memberId, String newName);

	/**
	 * 채팅방에서 나가기
	 *
	 * @param roomId 채팅방 ID
	 * @param member 나가려는 사용자
	 */
	void leaveRoom(Long roomId, Member member);

	List<ChatParticipantRes> getParticipants(Long roomId);
}
