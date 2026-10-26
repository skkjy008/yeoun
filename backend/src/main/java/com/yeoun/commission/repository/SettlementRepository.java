package com.yeoun.commission.repository;

import com.yeoun.commission.domain.Settlement;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    @EntityGraph(attributePaths = {"commission", "perfumer"})
    List<Settlement> findAllByPerfumerIdOrderByIdDesc(Long perfumerId);

    @EntityGraph(attributePaths = {"commission", "perfumer"})
    List<Settlement> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = {"commission", "perfumer"})
    List<Settlement> findAllByStatusOrderByIdDesc(Settlement.Status status);

    Optional<Settlement> findByCommissionId(Long commissionId);
}
