package com.yeoun.coupon.dto;

import com.yeoun.coupon.domain.Coupon;
import java.time.LocalDateTime;

public record CouponResponse(Long id, String name, int discountAmount, int minOrderAmount, LocalDateTime expiresAt,
                             LocalDateTime usedAt, boolean usable) {

    public static CouponResponse from(Coupon c) {
        return new CouponResponse(c.getId(), c.getName(), c.getDiscountAmount(), c.getMinOrderAmount(),
                c.getExpiresAt(), c.getUsedAt(), c.isUsable(LocalDateTime.now()));
    }
}
