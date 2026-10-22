package com.yeoun.member.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 회원 등급. 브론즈부터 다이아까지, 누적 구매 금액 기준으로 올라갑니다. */
@Getter
@RequiredArgsConstructor
public enum Grade {
    BRONZE("브론즈", 0),
    SILVER("실버", 100_000),
    GOLD("골드", 300_000),
    PLATINUM("플래티넘", 600_000),
    DIAMOND("다이아", 1_000_000);

    private final String label;
    /** 이 등급이 되기 위한 누적 구매 금액 */
    private final long threshold;

    public static Grade fromSpending(long totalSpent) {
        Grade result = BRONZE;
        for (Grade grade : values()) {
            if (totalSpent >= grade.threshold) {
                result = grade;
            }
        }
        return result;
    }

    public Grade next() {
        return this == DIAMOND ? null : values()[ordinal() + 1];
    }
}
