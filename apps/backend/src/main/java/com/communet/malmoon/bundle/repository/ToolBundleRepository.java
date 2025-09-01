package com.communet.malmoon.bundle.repository;

import com.communet.malmoon.bundle.domain.ToolBundle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ToolBundleRepository extends JpaRepository<ToolBundle, Long> {
    List<ToolBundle> findAllBytherapistId(Long therapistId);
}
