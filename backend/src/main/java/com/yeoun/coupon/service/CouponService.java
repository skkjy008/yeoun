package com.yeoun.coupon.service;

import com.yeoun.coupon.domain.Coupon;
import com.yeoun.coupon.dto.CouponResponse;
import com.yeoun.coupon.repository.CouponRepository;
import com.yeoun.member.domain.Member;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CouponService {

    private final CouponRepository couponRepository;

    /** 회원가입 시 환영 쿠폰(3,000원)을 한 번 발급합니다. */
    @Transactional
    public void issueWelcome(Member member) {
        if (!couponRepository.existsByMemberIdAndCode(member.getId(), Coupon.WELCOME)) {
            couponRepository.save(Coupon.welcome(member));
        }
    }

    public List<CouponResponse> findMine(Long memberId) {
        return couponRepository.findAllByMemberIdOrderByUsedAtAscExpiresAtAsc(memberId).stream()
                .map(CouponResponse::from)
                .toList();
    }

    public long countUsable(Long memberId) {
        return findMine(memberId).stream().filter(CouponResponse::usable).count();
    }
}
