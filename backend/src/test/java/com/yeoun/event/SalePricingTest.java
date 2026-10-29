package com.yeoun.event;

import static org.assertj.core.api.Assertions.assertThat;

import com.yeoun.event.service.SalePricing;
import org.junit.jupiter.api.Test;

class SalePricingTest {

    @Test
    void 할인_금액은_10원_단위로_절사한다() {
        assertThat(SalePricing.salePrice(38_000, 15)).isEqualTo(32_300);
        assertThat(SalePricing.salePrice(22_000, 15)).isEqualTo(18_700);
        assertThat(SalePricing.salePrice(34_500, 15)).isEqualTo(29_330); // 5,175 → 5,170
    }

    @Test
    void 특가가_없으면_정가_그대로() {
        assertThat(SalePricing.salePrice(78_000, 0)).isEqualTo(78_000);
        assertThat(SalePricing.salePrice(78_000, -5)).isEqualTo(78_000);
        assertThat(SalePricing.salePrice(78_000, 150)).isZero();
    }
}
