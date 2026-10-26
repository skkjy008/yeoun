package com.yeoun.order.domain;

import com.yeoun.coupon.domain.Coupon;
import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Address;
import com.yeoun.member.domain.Member;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 주문. ORDER는 SQL 예약어라 테이블은 orders, JPQL 엔티티 이름은 Orders 로 둡니다.
 * 주문서 제출 시 '결제 대기'로 만들고 재고·쿠폰·적립금을 예약하며, PG 승인 후 '결제 완료'가 됩니다.
 */
@Getter
@Entity(name = "Orders")
@Table(name = "orders", indexes = @Index(name = "idx_orders_member", columnList = "member_id, created_at"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 20)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private OrderStatus status;

    @Column(name = "orderer_name", nullable = false, length = 40)
    private String ordererName;

    @Column(name = "orderer_phone", nullable = false, length = 20)
    private String ordererPhone;

    @Column(name = "orderer_email", nullable = false, length = 120)
    private String ordererEmail;

    @Embedded
    private Address shippingAddress;

    @Column(name = "delivery_memo", length = 100)
    private String deliveryMemo;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private PaymentMethod paymentMethod;

    /** 카드사 · 은행 · 간편결제 서비스 이름 (예시 값) */
    @Column(name = "payment_provider", length = 30)
    private String paymentProvider;

    @Column(name = "payment_approval_no", length = 200)
    private String paymentApprovalNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Column(name = "items_amount", nullable = false)
    private int itemsAmount;

    @Column(name = "coupon_discount", nullable = false)
    private int couponDiscount;

    @Column(name = "point_used", nullable = false)
    private int pointUsed;

    @Column(name = "shipping_fee", nullable = false)
    private int shippingFee;

    @Column(name = "total_amount", nullable = false)
    private int totalAmount;

    @Column(name = "earned_point", nullable = false)
    private int earnedPoint;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /** 장바구니에서 주문했는지 — 결제가 끝나면 장바구니에서 해당 상품을 지웁니다. */
    @Column(name = "from_cart", nullable = false)
    private boolean fromCart;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id asc")
    private List<OrderItem> items = new ArrayList<>();

    @Builder
    private Order(String orderNumber, Member member, String ordererName, String ordererPhone, String ordererEmail,
                  Address shippingAddress, String deliveryMemo, PaymentMethod paymentMethod, String paymentProvider,
                  boolean fromCart) {
        this.orderNumber = orderNumber;
        this.member = member;
        this.ordererName = ordererName;
        this.ordererPhone = ordererPhone;
        this.ordererEmail = ordererEmail;
        this.shippingAddress = shippingAddress;
        this.deliveryMemo = deliveryMemo;
        this.paymentMethod = paymentMethod;
        this.paymentProvider = paymentProvider;
        this.fromCart = fromCart;
        this.status = OrderStatus.PENDING_PAYMENT;
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.assignOrder(this);
        this.itemsAmount += item.getLineAmount();
    }

    public void applyDiscounts(Coupon coupon, int couponDiscount, int pointUsed, int shippingFee) {
        this.coupon = coupon;
        this.couponDiscount = couponDiscount;
        this.pointUsed = pointUsed;
        this.shippingFee = shippingFee;
        this.totalAmount = itemsAmount - couponDiscount - pointUsed + shippingFee;
        if (totalAmount < 0) {
            throw ApiException.badRequest("결제 금액이 올바르지 않습니다.");
        }
    }

    /** PG 승인 완료 → 결제 완료 */
    public void markPaid(String approvalNo, String providerLabel) {
        if (status != OrderStatus.PENDING_PAYMENT) {
            throw ApiException.conflict("결제를 기다리는 주문이 아닙니다.");
        }
        this.paymentApprovalNo = approvalNo;
        if (providerLabel != null) {
            this.paymentProvider = providerLabel.length() > 30 ? providerLabel.substring(0, 30) : providerLabel;
        }
        this.paidAt = LocalDateTime.now();
        this.status = OrderStatus.PAID;
    }

    /** 결제창 취소·실패·만료 */
    public void markPaymentFailed() {
        if (status != OrderStatus.PENDING_PAYMENT) {
            throw ApiException.conflict("결제를 기다리는 주문이 아닙니다.");
        }
        this.status = OrderStatus.PAYMENT_FAILED;
        this.cancelledAt = LocalDateTime.now();
    }

    public String getOrderName() {
        if (items.isEmpty()) {
            return "여운 주문";
        }
        String first = items.get(0).getProductName();
        return items.size() == 1 ? first : "%s 외 %d건".formatted(first, items.size() - 1);
    }

    /** 다음 단계로 진행합니다. 순서를 건너뛸 수 없습니다. */
    public void advanceTo(OrderStatus target) {
        if (status.next() != target) {
            throw ApiException.badRequest("'%s' 다음 단계는 '%s'입니다.".formatted(status.getLabel(),
                    status.next() == null ? "없음" : status.next().getLabel()));
        }
        this.status = target;
    }

    public void cancel(boolean byAdmin) {
        boolean allowed = byAdmin ? status.isCancellableByAdmin() : status.isCancellableByMember();
        if (!allowed) {
            throw ApiException.badRequest(byAdmin
                    ? "배송이 시작된 주문은 취소할 수 없습니다."
                    : "결제 완료 상태에서만 바로 취소할 수 있어요. 상품 준비가 시작되었다면 고객센터로 문의해 주세요.");
        }
        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    /** 배송 완료 시 상품 금액의 1%를 적립합니다. */
    public int earnPoint() {
        this.earnedPoint = (itemsAmount - couponDiscount) / 100;
        return earnedPoint;
    }

    public boolean isOwnedBy(Long memberId) {
        return member.getId().equals(memberId);
    }

    public int getTotalQuantity() {
        return items.stream().mapToInt(OrderItem::getQuantity).sum();
    }
}
