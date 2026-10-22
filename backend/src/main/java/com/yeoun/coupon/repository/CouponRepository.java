package com.yeoun.coupon.repository;

import com.yeoun.coupon.domain.Coupon;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    List<Coupon> findAllByMemberIdOrderByUsedAtAscExpiresAtAsc(Long memberId);

    boolean existsByMemberIdAndCode(Long memberId, String code);
}
