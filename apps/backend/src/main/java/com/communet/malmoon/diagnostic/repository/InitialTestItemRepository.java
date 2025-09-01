package com.communet.malmoon.diagnostic.repository;

import com.communet.malmoon.diagnostic.domain.InitialTestItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InitialTestItemRepository extends JpaRepository<InitialTestItem, Long> {
    List<InitialTestItem> findByAttempt_AttemptIdOrderByItemIndex(UUID attemptId);
    Optional<InitialTestItem> findByAttempt_AttemptIdAndItemIndex(UUID attemptId, Integer itemIndex);
}
