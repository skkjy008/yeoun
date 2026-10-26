package com.yeoun.payment.service;

import com.yeoun.payment.domain.Payment;

/**
 * 결제 결과 이벤트. 주문·커미션 서비스가 같은 트랜잭션 안에서 받아 상태를 바꿉니다.
 * (PaymentService가 주문·커미션 서비스를 직접 알지 않도록 이벤트로 분리)
 */
public final class PaymentEvents {

    private PaymentEvents() {
    }

    public record Approved(Payment payment) {
    }

    public record Failed(Payment payment) {
    }
}
