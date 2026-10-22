package com.yeoun.commission.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 커미션 진행 단계 (아트머그 방식)
 * 의뢰 등록(제안 받는 중) → 조향사 선택 + 선결제(제작 중) → 조향사 전달(전달 완료) → 의뢰자 후기(완료)
 */
@Getter
@RequiredArgsConstructor
public enum CommissionStatus {
    OPEN("제안 받는 중"),
    IN_PROGRESS("제작 중"),
    DELIVERED("전달 완료"),
    COMPLETED("후기 완료"),
    CANCELLED("의뢰 취소");

    private final String label;
}
