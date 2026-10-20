package com.yeoun.preference.repository;

import com.yeoun.preference.domain.MemberPreference;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberPreferenceRepository extends JpaRepository<MemberPreference, Long> {

    @EntityGraph(attributePaths = {"question", "option"})
    List<MemberPreference> findAllByMemberId(Long memberId);

    boolean existsByMemberId(Long memberId);
}
