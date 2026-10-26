package com.yeoun.commission.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 조향사 정산. 구매 확정(또는 제작 중 취소 시 조향사 몫)이 생기면 '정산 대기'로 만들고,
 * 운영자가 실제 송금 후 '지급 완료'로 바꿉니다. 수수료는 정산 대상 금액의 feeRate(기본 10%)입니다.
 */
@Getter
@Entity
@Table(name = "settlement", indexes = @Index(name = "idx_settlement_perfumer", columnList = "perfumer_id, status"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Settlement extends BaseTimeEntity {

    public enum Status { PENDING, PAID }

    public enum Reason { CONFIRMED, PARTIAL_CANCEL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commission_id", nullable = false, unique = true)
    private Commission commission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfumer_id", nullable = false)
    private Member perfumer;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Reason reason;

    /** 정산 대상 금액 (결제 금액 - 환불 금액) */
    @Column(name = "gross_amount", nullable = false)
    private int grossAmount;

    @Column(name = "fee_amount", nullable = false)
    private int feeAmount;

    @Column(name = "net_amount", nullable = false)
    private int netAmount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Settlement(Commission commission, Member perfumer, Reason reason, int grossAmount, double feeRate) {
        this.commission = commission;
        this.perfumer = perfumer;
        this.reason = reason;
        this.grossAmount = grossAmount;
        this.feeAmount = (int) Math.round(grossAmount * feeRate);
        this.netAmount = grossAmount - feeAmount;
        this.status = Status.PENDING;
    }

    public void markPaid() {
        if (status == Status.PAID) {
            throw ApiException.conflict("이미 지급 완료된 정산입니다.");
        }
        this.status = Status.PAID;
        this.paidAt = LocalDateTime.now();
    }
}
