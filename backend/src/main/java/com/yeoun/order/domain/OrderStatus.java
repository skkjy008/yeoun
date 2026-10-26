package com.yeoun.order.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 주문 상태: (결제 대기 →) 결제 완료 → 상품 준비 중 → 배송 중 → 배송 완료 (결제 완료·준비 중에는 취소 가능) */
@Getter
@RequiredArgsConstructor
public enum OrderStatus {
    PENDING_PAYMENT("결제 대기"),
    PAYMENT_FAILED("결제 실패"),
    PAID("결제 완료"),
    PREPARING("상품 준비 중"),
    SHIPPING("배송 중"),
    DELIVERED("배송 완료"),
    CANCELLED("주문 취소");

    private final String label;

    public OrderStatus next() {
        return switch (this) {
            case PAID -> PREPARING;
            case PREPARING -> SHIPPING;
            case SHIPPING -> DELIVERED;
            default -> null;
        };
    }

    /** 회원 화면(목록·건수)에 보이는 상태 — 결제 대기/실패 주문은 숨깁니다. */
    public static final java.util.List<OrderStatus> VISIBLE = java.util.List.of(PAID, PREPARING, SHIPPING, DELIVERED,
            CANCELLED);

    public boolean isCancellableByMember() {
        return this == PAID;
    }

    public boolean isCancellableByAdmin() {
        return this == PAID || this == PREPARING;
    }
}
