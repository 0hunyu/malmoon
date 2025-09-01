package com.communet.malmoon.filter.repository;

import com.communet.malmoon.filter.domain.FilterSet;
import com.communet.malmoon.filter.domain.FilterSetInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FilterSetInfoRepository extends JpaRepository<FilterSetInfo, Long> {
    List<FilterSetInfo> findByFilterSet(FilterSet filterSet);
    void deleteByFilterSet(FilterSet filterSet);
}
