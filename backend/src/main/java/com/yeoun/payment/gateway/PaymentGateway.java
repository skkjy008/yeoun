package com.yeoun.payment.gateway;

import java.time.LocalDateTime;

/** PG 승인·취소 추상화. 토스페이먼츠(TossPaymentGateway)와 모의 결제(MockPaymentGateway) 구현이 있습니다. */
public interface PaymentGateway {

    String provider();

    Approval confirm(String paymentKey, String orderKey, int amount);

    void cancel(String paymentKey, String reason, Integer cancelAmount);

    record Approval(String paymentKey, String methodLabel, String receiptUrl, LocalDateTime approvedAt,
                    int totalAmount) {
    }
}
