package com.communet.malmoon.filter.repository;

import com.communet.malmoon.filter.domain.FilterSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FilterSetRepository extends JpaRepository<FilterSet, Long> {
    List<FilterSet> findAllByTherapistId(Long memberId);
}
