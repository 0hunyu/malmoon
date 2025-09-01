package com.communet.malmoon.diagnostic.repository;

import com.communet.malmoon.diagnostic.domain.InitialTestResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InitialTestResultRepository extends JpaRepository<InitialTestResult, UUID> {
}
