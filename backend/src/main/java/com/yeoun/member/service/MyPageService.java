package com.yeoun.member.service;

import com.yeoun.commission.repository.CommissionRepository;
import com.yeoun.coupon.service.CouponService;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.dto.AuthDtos.MemberResponse;
import com.yeoun.member.dto.MyPageDtos.AddressRequest;
import com.yeoun.member.dto.MyPageDtos.AddressResponse;
import com.yeoun.member.dto.MyPageDtos.GradeProgress;
import com.yeoun.member.dto.MyPageDtos.MyPageSummary;
import com.yeoun.member.dto.MyPageDtos.PasswordChangeRequest;
import com.yeoun.member.dto.MyPageDtos.ProfileUpdateRequest;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.member.repository.PerfumerApplicationRepository;
import com.yeoun.order.domain.OrderStatus;
import com.yeoun.order.dto.OrderDtos.OrderSummary;
import com.yeoun.order.repository.OrderRepository;
import com.yeoun.wishlist.service.WishlistService;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageService {

    private final MemberRepository memberRepository;
    private final PerfumerApplicationRepository applicationRepository;
    private final OrderRepository orderRepository;
    private final CouponService couponService;
    private final WishlistService wishlistService;
    private final CommissionRepository commissionRepository;
    private final PasswordEncoder passwordEncoder;

    /** 마이페이지 홈: 등급 진행도, 쿠폰·적립금, 주문 상태별 건수, 최근 주문 */
    public MyPageSummary summary(Long memberId) {
        Member member = get(memberId);
        Map<String, Long> counts = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.VISIBLE) {
            counts.put(status.name(), 0L);
        }
        orderRepository.countByStatus(memberId).stream()
                .filter(row -> OrderStatus.VISIBLE.contains(row.getStatus()))
                .forEach(row -> counts.put(row.getStatus().name(), row.getCnt()));

        long totalSpent = orderRepository.sumTotalAmount(memberId, OrderStatus.DELIVERED).longValue();
        OrderSummary recent = orderRepository
                .findFirstByMemberIdAndStatusInOrderByCreatedAtDescIdDesc(memberId,
                        java.util.List.of(OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.SHIPPING,
                                OrderStatus.DELIVERED))
                .map(OrderSummary::from)
                .orElse(null);

        return new MyPageSummary(memberResponse(member), member.isMarketingAgreed(), member.getPoint(),
                couponService.countUsable(memberId), wishlistService.findMyProductIds(memberId).size(),
                commissionRepository.findAllByRequesterIdOrderByCreatedAtDescIdDesc(memberId).size(),
                GradeProgress.of(member.getGrade(), totalSpent), counts, recent,
                AddressResponse.from(member.getAddress()));
    }

    @Transactional
    public MemberResponse updateProfile(Long memberId, ProfileUpdateRequest request) {
        Member member = get(memberId);
        member.updateProfile(request.name().trim(), request.phone(), request.marketingAgreed());
        return memberResponse(member);
    }

    @Transactional
    public void changePassword(Long memberId, PasswordChangeRequest request) {
        Member member = get(memberId);
        if (!passwordEncoder.matches(request.currentPassword(), member.getPassword())) {
            throw ApiException.badRequest("현재 비밀번호가 일치하지 않습니다.");
        }
        member.changePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public AddressResponse changeAddress(Long memberId, AddressRequest request) {
        Member member = get(memberId);
        member.changeAddress(request.toAddress());
        return AddressResponse.from(member.getAddress());
    }

    private MemberResponse memberResponse(Member member) {
        return MemberResponse.of(member, applicationRepository.findByMemberId(member.getId()).orElse(null));
    }

    private Member get(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));
    }
}
