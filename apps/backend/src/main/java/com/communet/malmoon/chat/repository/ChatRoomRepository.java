package com.communet.malmoon.chat.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.communet.malmoon.chat.domain.ChatRoom;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

	@Query("""
		SELECT cr FROM ChatRoom cr
		JOIN ChatRoomParticipant p1 ON cr.roomId = p1.roomId
		JOIN ChatRoomParticipant p2 ON cr.roomId = p2.roomId
		WHERE cr.roomType = 'ONE_TO_ONE'
		AND p1.memberId = :member1 AND p2.memberId = :member2
		GROUP BY cr.roomId
		HAVING COUNT(DISTINCT p1.memberId) = 1 AND COUNT(DISTINCT p2.memberId) = 1
		""")
	Optional<ChatRoom> findOneToOneRoomByParticipants(@Param("member1") Long aLong, @Param("member2") Long aLong1);

	Optional<ChatRoom> findBySessionId(String sessionId);
}
