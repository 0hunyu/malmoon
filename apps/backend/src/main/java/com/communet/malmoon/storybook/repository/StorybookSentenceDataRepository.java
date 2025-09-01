package com.communet.malmoon.storybook.repository;

import com.communet.malmoon.storybook.domain.StorybookSentence;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StorybookSentenceDataRepository extends JpaRepository<StorybookSentence, Long> {
}
