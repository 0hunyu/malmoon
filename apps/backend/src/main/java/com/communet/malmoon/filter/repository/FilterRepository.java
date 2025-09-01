package com.communet.malmoon.filter.repository;

import com.communet.malmoon.filter.domain.Filter;
import com.communet.malmoon.filter.domain.FilterStatusType;
import com.communet.malmoon.member.domain.Member;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilterRepository extends JpaRepository<Filter, Long> {
    @EntityGraph(attributePaths = {"owner"})
    @Query("SELECT f FROM Filter f WHERE f.status = :status AND (f.owner = :owner OR f.owner IS NULL)")
    List<Filter> findFiltersByStatusForOwnerOrGlobal(FilterStatusType status, Member owner);
}
