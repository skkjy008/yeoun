package com.yeoun.commission.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 커미션 진행 단계
 * 제안 받는 중 → (제안 선택 + 선결제) 결제 완료 → 제작 중 → 전달 완료 → 구매 확정(정산)
 * 환불: 결제 완료(제작 전) 100% · 제작 중 50% · 전달 이후 불가
 */
@Getter
@RequiredArgsConstructor
public enum CommissionStatus {
    OPEN("제안 받는 중"),
    PAID("결제 완료 · 제작 대기"),
    IN_PROGRESS("제작 중"),
    DELIVERED("전달 완료"),
    COMPLETED("구매 확정"),
    CANCELLED("의뢰 취소");

    private final String label;
}
