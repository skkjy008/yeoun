package com.yeoun.event.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 룰렛 경품과 당첨 가중치. 할인율이 클수록 당첨 확률이 낮습니다.
 * 꽝 55% · 10% 할인 30% · 20% 할인 12% · 50% 할인 3%
 */
@Getter
@RequiredArgsConstructor
public enum RoulettePrize {
    MISS("꽝", 0, 0, 55),
    OFF_10("10% 할인", 10, 10_000, 30),
    OFF_20("20% 할인", 20, 20_000, 12),
    OFF_50("50% 할인", 50, 30_000, 3);

    private final String label;
    private final int rate;
    /** 정률 쿠폰의 최대 할인 금액 */
    private final int maxDiscount;
    private final int weight;

    public static int totalWeight() {
        int total = 0;
        for (RoulettePrize prize : values()) {
            total += prize.weight;
        }
        return total;
    }

    /** 0 이상 totalWeight() 미만의 값을 받아 해당 구간의 경품을 돌려줍니다. */
    public static RoulettePrize pick(int roll) {
        int cumulative = 0;
        for (RoulettePrize prize : values()) {
            cumulative += prize.weight;
            if (roll < cumulative) {
                return prize;
            }
        }
        return MISS;
    }
}
