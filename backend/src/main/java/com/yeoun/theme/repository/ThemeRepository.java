package com.yeoun.theme.repository;

import com.yeoun.theme.domain.Theme;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThemeRepository extends JpaRepository<Theme, Long> {

    List<Theme> findAllByPublishedTrueOrderBySortOrderAscIdAsc();

    List<Theme> findAllByOrderBySortOrderAscIdAsc();

    Optional<Theme> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
