package com.yeoun.coupon;

import static org.assertj.core.api.Assertions.assertThat;

import com.yeoun.coupon.domain.Coupon;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class CouponDiscountTest {

    private final LocalDateTime expires = LocalDateTime.now().plusDays(7);

    @Test
    void 정액_쿠폰은_주문_금액을_넘지_않는다() {
        Coupon coupon = new Coupon(null, "WELCOME", "환영", 3_000, 30_000, expires);
        assertThat(coupon.discountFor(45_000)).isEqualTo(3_000);
        assertThat(coupon.discountFor(2_000)).isEqualTo(2_000);
    }

    @Test
    void 정률_쿠폰은_10원_단위로_내리고_최대_할인_금액까지만_깎는다() {
        Coupon tenPercent = Coupon.percent(null, "ROULETTE", "10%", 10, 10_000, 30_000, expires);
        assertThat(tenPercent.discountFor(38_000)).isEqualTo(3_800);
        assertThat(tenPercent.discountFor(38_250)).isEqualTo(3_820);
        assertThat(tenPercent.discountFor(200_000)).isEqualTo(10_000);

        Coupon half = Coupon.percent(null, "ROULETTE", "50%", 50, 30_000, 30_000, expires);
        assertThat(half.discountFor(44_000)).isEqualTo(22_000);
        assertThat(half.discountFor(100_000)).isEqualTo(30_000);
    }
}
