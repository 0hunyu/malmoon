package com.communet.malmoon.chat.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.communet.malmoon.chat.domain.ChatRoomParticipant;

@Repository
public interface ChatRoomParticipantRepository extends JpaRepository<ChatRoomParticipant, Long> {

	List<ChatRoomParticipant> findByMemberIdAndLeftAtIsNull(Long memberId);

	List<ChatRoomParticipant> findByRoomIdAndLeftAtIsNull(Long roomId);

	boolean existsByRoomIdAndMemberId(Long roomId, Long memberId);

	boolean existsByRoomIdAndLeftAtIsNull(Long roomId);

	Optional<ChatRoomParticipant> findByRoomIdAndMemberId(Long roomId, Long memberId);

}
