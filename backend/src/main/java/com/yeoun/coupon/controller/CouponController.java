package com.yeoun.coupon.controller;

import com.yeoun.coupon.dto.CouponResponse;
import com.yeoun.coupon.service.CouponService;
import com.yeoun.global.security.AuthMember;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/api/coupons/me")
    public List<CouponResponse> mine(@AuthenticationPrincipal AuthMember me) {
        return couponService.findMine(me.id());
    }
}
