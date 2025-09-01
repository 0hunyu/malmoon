package com.communet.malmoon.aac.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.communet.malmoon.aac.domain.Aac;
import com.communet.malmoon.aac.domain.AacStatus;

import jakarta.persistence.criteria.Predicate;

/**
 * AAC 동적 검색 조건(Specification)을 정의하는 클래스입니다.
 *
 * 상황(situation), 행동(action), 감정(emotion)에 따라 조건이 유동적으로 적용되며,
 * 상태(status)는 DEFAULT 또는 PUBLIC으로 고정되어 필터링됩니다.
 *
 * JPA Criteria API를 사용하여 Predicate 조건을 생성하며,
 * Repository에서 Specification 기반으로 쿼리를 생성할 수 있도록 합니다.
 */
public class AacSpecification {

	/**
	 * 상황, 행동, 감정 값에 따라 동적으로 필터링 조건을 구성하는 Specification입니다.
	 *
	 * - 상태는 고정적으로 AacStatus.DEFAULT, AacStatus.PUBLIC만 포함됩니다.
	 * - 입력된 필드(situation, action, emotion)는 null 또는 공백이 아닌 경우에만 조건에 포함됩니다.
	 *
	 * @param situation 상황 필터 조건 (nullable)
	 * @param action 행동 필터 조건 (nullable)
	 * @param emotion 감정 필터 조건 (nullable)
	 * @return JPA Criteria 기반 Specification 조건 객체
	 */
	public static Specification<Aac> withFilters(String situation, String action, String emotion, Long therapistId) {
		return (root, query, builder) -> {
			List<Predicate> predicates = new ArrayList<>();

			// 기본적으로 DEFAULT, PUBLIC 상태인 AAC 조회
			Predicate publicPredicate = root.get("status").in(AacStatus.DEFAULT, AacStatus.PUBLIC);

			// therapistId가 있을 경우, 본인이 생성한 PRIVATE도 포함
			if (therapistId != null) {
				Predicate ownPrivatePredicate = builder.and(
					builder.equal(root.get("status"), AacStatus.PRIVATE),
					builder.equal(root.get("therapistId"), therapistId)
				);
				predicates.add(builder.or(publicPredicate, ownPrivatePredicate));
			} else {
				// 비로그인 사용자 또는 therapistId가 없는 경우, PUBLIC/DEFAULT만
				predicates.add(publicPredicate);
			}
			
			// 선택적 필터
			if (situation != null && !situation.isBlank()) {
				predicates.add(builder.equal(root.get("situation"), situation));
			}

			if (action != null && !action.isBlank()) {
				predicates.add(builder.equal(root.get("action"), action));
			}

			if (emotion != null && !emotion.isBlank()) {
				predicates.add(builder.equal(root.get("emotion"), emotion));
			}

			return builder.and(predicates.toArray(new Predicate[0]));
		};
	}
}
