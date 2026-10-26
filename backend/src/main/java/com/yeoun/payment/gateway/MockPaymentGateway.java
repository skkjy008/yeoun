package com.yeoun.payment.gateway;

import java.time.LocalDateTime;

/**
 * 모의 결제. 토스페이먼츠 키가 없을 때 사용하며, 실제 결제나 카드 정보 수집 없이 바로 승인합니다.
 * paymentKey는 프론트엔드가 "MOCK-"으로 시작하는 값을 만들어 보냅니다.
 */
public class MockPaymentGateway implements PaymentGateway {

    public static final String PROVIDER = "MOCK";

    @Override
    public String provider() {
        return PROVIDER;
    }

    @Override
    public Approval confirm(String paymentKey, String orderKey, int amount) {
        if (paymentKey == null || !paymentKey.startsWith("MOCK-")) {
            throw new PaymentGatewayException("INVALID_PAYMENT_KEY", "모의 결제 키가 올바르지 않습니다.");
        }
        return new Approval(paymentKey, "모의 결제", null, LocalDateTime.now(), amount);
    }

    @Override
    public void cancel(String paymentKey, String reason, Integer cancelAmount) {
        // 모의 결제는 PG 호출 없이 환불 처리됩니다.
    }
}
