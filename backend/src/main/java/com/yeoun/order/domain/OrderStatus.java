package com.yeoun.order.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 주문 상태: 결제 완료 → 상품 준비 중 → 배송 중 → 배송 완료 (결제 완료·준비 중에는 취소 가능) */
@Getter
@RequiredArgsConstructor
public enum OrderStatus {
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

    public boolean isCancellableByMember() {
        return this == PAID;
    }

    public boolean isCancellableByAdmin() {
        return this == PAID || this == PREPARING;
    }
}
