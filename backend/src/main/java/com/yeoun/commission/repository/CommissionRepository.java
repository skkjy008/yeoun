package com.yeoun.commission.repository;

import com.yeoun.commission.domain.Commission;
import com.yeoun.commission.domain.CommissionStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommissionRepository extends JpaRepository<Commission, Long> {

    @EntityGraph(attributePaths = {"requester", "perfumer"})
    Page<Commission> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"requester", "perfumer"})
    Page<Commission> findAllByStatusOrderByCreatedAtDescIdDesc(CommissionStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"requester", "perfumer"})
    List<Commission> findAllByRequesterIdOrderByCreatedAtDescIdDesc(Long requesterId);

    @Query("""
            select coalesce(avg(c.perfumerRating), 0) from Commission c
            where c.perfumer.id = :perfumerId and c.perfumerRating is not null
            """)
    double averagePerfumerRating(@Param("perfumerId") Long perfumerId);

    long countByPerfumerIdAndStatus(Long perfumerId, CommissionStatus status);

    List<Commission> findAllByStatusAndDeliveredAtBefore(CommissionStatus status, java.time.LocalDateTime before);
}
