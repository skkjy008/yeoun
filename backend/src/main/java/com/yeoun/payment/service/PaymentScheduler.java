package com.yeoun.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentScheduler {

    private final PaymentService paymentService;

    /** 5분마다 결제창에서 돌아오지 않은 결제를 만료시키고 예약한 재고·쿠폰을 돌려놓습니다. */
    @Scheduled(fixedDelay = 300_000, initialDelay = 60_000)
    public void expireStalePayments() {
        int expired = paymentService.expireStale();
        if (expired > 0) {
            log.info("[payment] 만료된 결제 {}건을 정리했습니다.", expired);
        }
    }
}
