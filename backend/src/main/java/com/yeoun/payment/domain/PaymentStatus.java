package com.yeoun.payment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentStatus {
    READY("결제 대기"),
    DONE("결제 완료"),
    PARTIAL_CANCELED("부분 환불"),
    CANCELED("전액 환불"),
    ABORTED("결제 실패");

    private final String label;
}
