package com.yeoun.commission.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CommissionScheduler {

    private final CommissionService commissionService;

    /** 매시 정각: 전달 후 7일이 지난 의뢰를 자동 구매 확정하고 정산 대기로 넘깁니다. */
    @Scheduled(cron = "0 0 * * * *")
    public void autoConfirm() {
        int confirmed = commissionService.autoConfirm();
        if (confirmed > 0) {
            log.info("[commission] {}건을 자동 구매 확정했습니다.", confirmed);
        }
    }
}
