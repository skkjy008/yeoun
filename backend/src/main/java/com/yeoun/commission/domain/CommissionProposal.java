package com.yeoun.commission.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 조향사의 제안 (가격 · 작업 기간 · 어떤 향으로 풀어낼지) */
@Getter
@Entity
@Table(name = "commission_proposal", uniqueConstraints = @UniqueConstraint(name = "uk_proposal_commission_perfumer",
        columnNames = {"commission_id", "perfumer_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommissionProposal extends BaseTimeEntity {

    public enum Status { PROPOSED, ACCEPTED, DECLINED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commission_id", nullable = false)
    private Commission commission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfumer_id", nullable = false)
    private Member perfumer;

    @Column(nullable = false)
    private int price;

    @Column(name = "working_days", nullable = false)
    private int workingDays;

    @Column(nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Status status;

    public CommissionProposal(Commission commission, Member perfumer, int price, int workingDays, String message) {
        this.commission = commission;
        this.perfumer = perfumer;
        this.price = price;
        this.workingDays = workingDays;
        this.message = message;
        this.status = Status.PROPOSED;
    }

    public void accept() {
        this.status = Status.ACCEPTED;
    }

    public void decline() {
        this.status = Status.DECLINED;
    }
}
