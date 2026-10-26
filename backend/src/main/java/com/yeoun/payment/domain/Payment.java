package com.yeoun.payment.domain;

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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 결제 1건. 주문서 제출(또는 커미션 제안 선택) 시 READY로 만들고,
 * PG 결제창 인증 후 서버 승인(confirm)에 성공하면 DONE, 환불되면 CANCELED/PARTIAL_CANCELED가 됩니다.
 * orderKey는 PG에 넘기는 주문 ID(6~64자, 영문·숫자·-·_)입니다.
 */
@Getter
@Entity
@Table(name = "payment", indexes = @Index(name = "idx_payment_target", columnList = "target_type, target_id"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "target_type", nullable = false, length = 20)
    private PaymentTarget targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    /** 커미션 결제일 때 선택한 제안 ID */
    @Column(name = "target_ref")
    private Long targetRef;

    @Column(name = "order_key", nullable = false, unique = true, length = 64)
    private String orderKey;

    @Column(name = "order_name", nullable = false, length = 100)
    private String orderName;

    /** TOSS / MOCK */
    @Column(nullable = false, length = 20)
    private String provider;

    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column(name = "payment_key", unique = true, length = 200)
    private String paymentKey;

    /** PG가 알려 준 결제수단 (카드, 간편결제, 계좌이체 …) */
    @Column(name = "method_label", length = 40)
    private String methodLabel;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "canceled_amount", nullable = false)
    private int canceledAmount;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "failure_code", length = 60)
    private String failureCode;

    @Column(name = "failure_message", length = 300)
    private String failureMessage;

    @Builder
    private Payment(Member member, PaymentTarget targetType, Long targetId, Long targetRef, String orderKey,
                    String orderName, String provider, int amount) {
        this.member = member;
        this.targetType = targetType;
        this.targetId = targetId;
        this.targetRef = targetRef;
        this.orderKey = orderKey;
        this.orderName = orderName;
        this.provider = provider;
        this.amount = amount;
        this.status = PaymentStatus.READY;
    }

    public boolean isOwnedBy(Long memberId) {
        return member.getId().equals(memberId);
    }

    public void approve(String paymentKey, String methodLabel, String receiptUrl, LocalDateTime approvedAt) {
        if (status != PaymentStatus.READY) {
            throw ApiException.conflict("이미 처리된 결제입니다.");
        }
        this.paymentKey = paymentKey;
        this.methodLabel = methodLabel;
        this.receiptUrl = receiptUrl;
        this.approvedAt = approvedAt == null ? LocalDateTime.now() : approvedAt;
        this.status = PaymentStatus.DONE;
    }

    public void abort(String code, String message) {
        if (status == PaymentStatus.READY) {
            this.status = PaymentStatus.ABORTED;
            this.failureCode = code;
            this.failureMessage = message == null ? null : message.substring(0, Math.min(300, message.length()));
        }
    }

    public int getRefundableAmount() {
        return amount - canceledAmount;
    }

    public void cancel(int cancelAmount) {
        if (status != PaymentStatus.DONE && status != PaymentStatus.PARTIAL_CANCELED) {
            throw ApiException.badRequest("환불할 수 있는 결제가 아닙니다.");
        }
        if (cancelAmount <= 0 || cancelAmount > getRefundableAmount()) {
            throw ApiException.badRequest("환불 금액이 올바르지 않습니다.");
        }
        this.canceledAmount += cancelAmount;
        this.canceledAt = LocalDateTime.now();
        this.status = canceledAmount == amount ? PaymentStatus.CANCELED : PaymentStatus.PARTIAL_CANCELED;
    }
}
