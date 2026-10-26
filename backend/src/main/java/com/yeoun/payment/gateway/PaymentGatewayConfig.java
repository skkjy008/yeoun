package com.yeoun.payment.gateway;

import com.yeoun.global.config.YeounProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class PaymentGatewayConfig {

    /** 토스페이먼츠 키가 있으면 실제 PG, 없으면 모의 결제 */
    @Bean
    public PaymentGateway paymentGateway(YeounProperties properties) {
        YeounProperties.Payment.Toss toss = properties.payment().toss();
        if (toss.enabled()) {
            log.info("[payment] 토스페이먼츠 결제를 사용합니다. ({})", toss.clientKey().startsWith("test_") ? "테스트 키" : "라이브 키");
            return new TossPaymentGateway(toss.secretKey(), toss.apiBaseUrl());
        }
        log.info("[payment] 토스페이먼츠 키가 없어 모의 결제로 동작합니다.");
        return new MockPaymentGateway();
    }
}
