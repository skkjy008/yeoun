package com.yeoun.event;

import static org.assertj.core.api.Assertions.assertThat;

import com.yeoun.event.domain.RoulettePrize;
import java.util.EnumMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class RoulettePrizeTest {

    @Test
    void 할인율이_클수록_당첨_구간이_좁다() {
        Map<RoulettePrize, Integer> counts = new EnumMap<>(RoulettePrize.class);
        for (int roll = 0; roll < RoulettePrize.totalWeight(); roll++) {
            counts.merge(RoulettePrize.pick(roll), 1, Integer::sum);
        }
        assertThat(RoulettePrize.totalWeight()).isEqualTo(100);
        assertThat(counts.get(RoulettePrize.MISS)).isEqualTo(55);
        assertThat(counts.get(RoulettePrize.OFF_10)).isGreaterThan(counts.get(RoulettePrize.OFF_20));
        assertThat(counts.get(RoulettePrize.OFF_20)).isGreaterThan(counts.get(RoulettePrize.OFF_50));
        assertThat(counts.get(RoulettePrize.OFF_50)).isEqualTo(3);
    }
}
