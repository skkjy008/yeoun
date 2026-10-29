package com.yeoun.coupon.dto;

import com.yeoun.coupon.domain.Coupon;
import java.time.LocalDateTime;

/** discountRate가 있으면 정률(%) 쿠폰, 없으면 discountAmount 정액 쿠폰 */
public record CouponResponse(Long id, String name, int discountAmount, Integer discountRate,
                             Integer maxDiscountAmount, int minOrderAmount, LocalDateTime expiresAt,
                             LocalDateTime usedAt, boolean usable) {

    public static CouponResponse from(Coupon c) {
        return new CouponResponse(c.getId(), c.getName(), c.getDiscountAmount(), c.getDiscountRate(),
                c.getMaxDiscountAmount(), c.getMinOrderAmount(), c.getExpiresAt(), c.getUsedAt(),
                c.isUsable(LocalDateTime.now()));
    }
}
