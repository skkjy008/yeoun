package com.yeoun.order.service;

import com.yeoun.order.domain.PaymentMethod;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * 포트폴리오용 모의 결제 승인기. 실제 PG 연동 시 이 컴포넌트만 교체하면 됩니다.
 * 카드 번호 등 결제 정보는 받지도 저장하지도 않습니다.
 */
@Component
public class MockPaymentGateway {

    public String approve(PaymentMethod method, int amount) {
        return "MOCK-" + method.name().charAt(0) + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
