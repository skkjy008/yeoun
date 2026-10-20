package com.yeoun.preference.repository;

import com.yeoun.preference.domain.PreferenceQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PreferenceQuestionRepository extends JpaRepository<PreferenceQuestion, Long> {

    @EntityGraph(attributePaths = "options")
    List<PreferenceQuestion> findAllByOrderByQuestionNoAsc();
}
