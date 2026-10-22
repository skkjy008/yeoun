package com.yeoun.commission.repository;

import com.yeoun.commission.domain.CommissionProposal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommissionProposalRepository extends JpaRepository<CommissionProposal, Long> {

    @EntityGraph(attributePaths = "perfumer")
    List<CommissionProposal> findAllByCommissionIdOrderByCreatedAtAscIdAsc(Long commissionId);

    Optional<CommissionProposal> findByCommissionIdAndPerfumerId(Long commissionId, Long perfumerId);

    boolean existsByCommissionIdAndPerfumerId(Long commissionId, Long perfumerId);

    long countByCommissionId(Long commissionId);

    @EntityGraph(attributePaths = {"commission", "commission.requester"})
    List<CommissionProposal> findAllByPerfumerIdOrderByCreatedAtDescIdDesc(Long perfumerId);
}
