package com.yeoun.coupon.service;

import com.yeoun.coupon.domain.Coupon;
import com.yeoun.coupon.dto.CouponResponse;
import com.yeoun.coupon.repository.CouponRepository;
import com.yeoun.global.exception.ApiException;
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

    /** 신규 가입 이벤트: 회원마다 환영 쿠폰(3,000원)을 한 번만 받을 수 있습니다. */
    @Transactional
    public CouponResponse claimWelcome(Member member) {
        if (couponRepository.existsByMemberIdAndCode(member.getId(), Coupon.WELCOME)) {
            throw ApiException.conflict("이미 쿠폰을 받으셨습니다.");
        }
        return CouponResponse.from(couponRepository.save(Coupon.welcome(member)));
    }

    @Transactional
    public Coupon save(Coupon coupon) {
        return couponRepository.save(coupon);
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
