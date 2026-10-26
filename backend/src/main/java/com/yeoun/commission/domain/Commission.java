package com.yeoun.commission.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.order.domain.PaymentMethod;
import com.yeoun.product.domain.Category;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 커스텀 향 의뢰(커미션). 의뢰자가 원하는 향을 글로 남기면 인증 조향사들이 제안을 보냅니다. */
@Getter
@Entity
@Table(name = "commission", indexes = {
        @Index(name = "idx_commission_status", columnList = "status, created_at"),
        @Index(name = "idx_commission_requester", columnList = "requester_id")})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Commission extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private Member requester;

    @Column(nullable = false, length = 60)
    private String title;

    /** 원하는 향 종류 inc_cd (없으면 조향사 제안에 맡김) */
    @Column(name = "inc_cd", length = 3)
    private String incCd;

    /** 떠오르는 장면·키워드 (쉼표 구분) */
    @Column(length = 200)
    private String moods;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private int budget;

    @Column(name = "desired_date")
    private LocalDate desiredDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private CommissionStatus status;

    /** 선택된 조향사 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfumer_id")
    private Member perfumer;

    @Column(name = "agreed_price")
    private Integer agreedPrice;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_approval_no", length = 200)
    private String paymentApprovalNo;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "delivery_note", length = 1000)
    private String deliveryNote;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    /** 후기: 향 만족도와 조향사 평가를 따로 받습니다. */
    @Column(name = "scent_rating")
    private Integer scentRating;

    @Column(name = "perfumer_rating")
    private Integer perfumerRating;

    @Column(name = "review_content", length = 1000)
    private String reviewContent;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancel_reason", length = 300)
    private String cancelReason;

    /** 의뢰인에게 돌려준 금액 */
    @Column(name = "refund_amount")
    private Integer refundAmount;

    /** 참고 이미지 URL (줄바꿈 구분, 최대 3장) */
    @Column(name = "reference_images", length = 1000)
    private String referenceImages;

    @Builder
    private Commission(Member requester, String title, String incCd, String moods, String description, int budget,
                       LocalDate desiredDate, List<String> referenceImages) {
        this.requester = requester;
        this.title = title;
        this.incCd = incCd == null || incCd.isBlank() ? null : Category.fromCode(incCd).getCode();
        this.moods = moods;
        this.description = description;
        this.budget = budget;
        this.desiredDate = desiredDate;
        this.referenceImages = referenceImages == null || referenceImages.isEmpty() ? null
                : String.join("\n", referenceImages);
        this.status = CommissionStatus.OPEN;
    }

    public List<String> getReferenceImageList() {
        if (referenceImages == null || referenceImages.isBlank()) {
            return List.of();
        }
        return Arrays.stream(referenceImages.split("\n")).filter(s -> !s.isBlank()).toList();
    }

    public String getCategoryLabel() {
        return incCd == null ? "조향사 제안에 맡김" : Category.fromCode(incCd).getLabel();
    }

    public List<String> getMoodList() {
        if (moods == null || moods.isBlank()) {
            return List.of();
        }
        return Arrays.stream(moods.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public boolean isRequestedBy(Long memberId) {
        return requester.getId().equals(memberId);
    }

    public boolean isAssignedTo(Long memberId) {
        return perfumer != null && perfumer.getId().equals(memberId);
    }

    /** 선결제가 승인되면 조향사가 정해지고 '결제 완료 · 제작 대기'가 됩니다. */
    public void accept(CommissionProposal proposal, PaymentMethod method, String approvalNo) {
        requireStatus(CommissionStatus.OPEN, "제안을 받는 중인 의뢰만 조향사를 선택할 수 있어요.");
        this.perfumer = proposal.getPerfumer();
        this.agreedPrice = proposal.getPrice();
        this.paymentMethod = method;
        this.paymentApprovalNo = approvalNo;
        this.paidAt = LocalDateTime.now();
        this.status = CommissionStatus.PAID;
    }

    public void start() {
        requireStatus(CommissionStatus.PAID, "결제가 끝난 의뢰만 제작을 시작할 수 있어요.");
        this.startedAt = LocalDateTime.now();
        this.status = CommissionStatus.IN_PROGRESS;
    }

    public void deliver(String note) {
        requireStatus(CommissionStatus.IN_PROGRESS, "제작 중인 의뢰만 전달할 수 있어요.");
        this.deliveryNote = note;
        this.deliveredAt = LocalDateTime.now();
        this.status = CommissionStatus.DELIVERED;
    }

    /** 구매 확정 (의뢰인 확정 · 후기 작성 · 전달 후 자동 확정) */
    public void confirm() {
        requireStatus(CommissionStatus.DELIVERED, "전달받은 의뢰만 구매 확정할 수 있어요.");
        this.confirmedAt = LocalDateTime.now();
        this.status = CommissionStatus.COMPLETED;
    }

    public boolean canReview() {
        return reviewedAt == null && (status == CommissionStatus.DELIVERED || status == CommissionStatus.COMPLETED);
    }

    public void review(int scentRating, int perfumerRating, String content) {
        if (!canReview()) {
            throw ApiException.badRequest("향을 전달받은 뒤에 후기를 한 번 남길 수 있어요.");
        }
        this.scentRating = scentRating;
        this.perfumerRating = perfumerRating;
        this.reviewContent = content;
        this.reviewedAt = LocalDateTime.now();
    }

    /** 단계별 환불 금액: 제안 받는 중 0원(결제 전) · 결제 완료 100% · 제작 중 refundRate · 이후 불가 */
    public int refundAmountFor(double inProgressRefundRate) {
        return switch (status) {
            case OPEN -> 0;
            case PAID -> agreedPrice;
            case IN_PROGRESS -> (int) Math.floor(agreedPrice * inProgressRefundRate / 10) * 10;
            default -> throw ApiException.badRequest("향이 전달된 뒤에는 의뢰를 취소할 수 없어요.");
        };
    }

    public boolean isCancellable() {
        return status == CommissionStatus.OPEN || status == CommissionStatus.PAID
                || status == CommissionStatus.IN_PROGRESS;
    }

    public void cancel(String reason, int refundAmount) {
        if (!isCancellable()) {
            throw ApiException.badRequest("향이 전달된 뒤에는 의뢰를 취소할 수 없어요.");
        }
        this.cancelReason = reason;
        this.refundAmount = status == CommissionStatus.OPEN ? null : refundAmount;
        this.cancelledAt = LocalDateTime.now();
        this.status = CommissionStatus.CANCELLED;
    }

    public LocalDateTime autoConfirmAt(int days) {
        return deliveredAt == null ? null : deliveredAt.plusDays(days);
    }

    private void requireStatus(CommissionStatus expected, String message) {
        if (status != expected) {
            throw ApiException.badRequest(message);
        }
    }
}
