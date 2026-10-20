package com.yeoun.member.repository;

import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.PerfumerApplication.Status;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PerfumerApplicationRepository extends JpaRepository<PerfumerApplication, Long> {

    @EntityGraph(attributePaths = "member")
    List<PerfumerApplication> findAllByStatusOrderByCreatedAtDesc(Status status);

    @EntityGraph(attributePaths = "member")
    List<PerfumerApplication> findAllByOrderByCreatedAtDesc();

    Optional<PerfumerApplication> findByMemberId(Long memberId);
}
