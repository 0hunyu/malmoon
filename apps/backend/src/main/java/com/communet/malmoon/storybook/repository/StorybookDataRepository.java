package com.communet.malmoon.storybook.repository;

import com.communet.malmoon.storybook.domain.Storybook;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StorybookDataRepository extends JpaRepository<Storybook, Long> {
    boolean existsByIsbn(String isbn);
}
