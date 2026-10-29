package com.yeoun.event.service;

import com.yeoun.coupon.domain.Coupon;
import com.yeoun.coupon.dto.CouponResponse;
import com.yeoun.coupon.service.CouponService;
import com.yeoun.event.domain.Event;
import com.yeoun.event.domain.EventKind;
import com.yeoun.event.domain.RoulettePrize;
import com.yeoun.event.domain.RouletteSpin;
import com.yeoun.event.dto.EventDtos.EventDetail;
import com.yeoun.event.dto.EventDtos.EventSummary;
import com.yeoun.event.dto.EventDtos.PrizeInfo;
import com.yeoun.event.dto.EventDtos.RouletteStatus;
import com.yeoun.event.dto.EventDtos.SpinResult;
import com.yeoun.event.repository.EventRepository;
import com.yeoun.event.repository.RouletteSpinRepository;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.repository.MemberRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    /** 하루 1회 기준은 한국 시간 자정 */
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final int ROULETTE_MIN_ORDER = 30_000;
    private static final int ROULETTE_COUPON_DAYS = 7;

    private final EventRepository eventRepository;
    private final RouletteSpinRepository spinRepository;
    private final MemberRepository memberRepository;
    private final CouponService couponService;
    private final SecureRandom random = new SecureRandom();

    /** 진행 중 → 예정 → 종료 순, 같은 상태끼리는 정렬 순서대로 */
    public List<EventSummary> list() {
        LocalDate today = today();
        return eventRepository.findAllByPublishedTrueOrderBySortOrderAscIdAsc().stream()
                .map(e -> EventSummary.of(e, today))
                .sorted(Comparator.comparingInt(s -> switch (s.status()) {
                    case "ONGOING" -> 0;
                    case "UPCOMING" -> 1;
                    default -> 2;
                }))
                .toList();
    }

    public EventDetail detail(String slug) {
        Event event = eventRepository.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> ApiException.notFound("이벤트를 찾을 수 없습니다."));
        return EventDetail.of(event, today());
    }

    public RouletteStatus rouletteStatus(Long memberId) {
        LocalDate today = today();
        Optional<RouletteSpin> spin = memberId == null ? Optional.empty()
                : spinRepository.findByMemberIdAndSpunOn(memberId, today);
        return new RouletteStatus(spin.isPresent(), spin.map(s -> s.getPrize().name()).orElse(null),
                spin.map(s -> s.getPrize().getLabel()).orElse(null), nextAvailableAt(today),
                rouletteEvent().map(e -> e.isActiveOn(today)).orElse(false), PrizeInfo.all());
    }

    /**
     * 룰렛 돌리기. 결과는 서버에서 가중치 추첨으로 정하고(화면은 그 결과에 맞춰 멈추기만 함),
     * 당첨되면 정률 할인 쿠폰을 바로 발급합니다. 한국 시간 기준 하루 한 번.
     */
    @Transactional
    public SpinResult spin(Long memberId) {
        LocalDate today = today();
        if (rouletteEvent().filter(e -> e.isActiveOn(today)).isEmpty()) {
            throw ApiException.badRequest("지금은 룰렛 이벤트 기간이 아니에요.");
        }
        if (spinRepository.findByMemberIdAndSpunOn(memberId, today).isPresent()) {
            throw ApiException.conflict("오늘은 이미 룰렛을 돌렸어요. 내일 다시 도전해 주세요.");
        }
        Member member = memberRepository.getReferenceById(memberId);
        RoulettePrize prize = RoulettePrize.pick(random.nextInt(RoulettePrize.totalWeight()));

        Coupon coupon = null;
        if (prize != RoulettePrize.MISS) {
            coupon = couponService.save(Coupon.percent(member, Coupon.ROULETTE,
                    "룰렛 %d%% 할인 쿠폰".formatted(prize.getRate()), prize.getRate(), prize.getMaxDiscount(),
                    ROULETTE_MIN_ORDER, LocalDateTime.now().plusDays(ROULETTE_COUPON_DAYS)));
        }
        try {
            spinRepository.saveAndFlush(new RouletteSpin(member, today, prize, coupon));
        } catch (DataIntegrityViolationException e) {
            // 거의 동시에 두 번 누른 경우: 유니크 제약으로 한 번만 인정
            throw ApiException.conflict("오늘은 이미 룰렛을 돌렸어요. 내일 다시 도전해 주세요.");
        }
        String message = prize == RoulettePrize.MISS
                ? "아쉽게도 꽝이에요. 내일 다시 도전해 주세요!"
                : "%s 쿠폰이 발급되었어요! %,d원 이상 주문 시 최대 %,d원까지 할인돼요. (%d일 동안 사용 가능)".formatted(
                        prize.getLabel(), ROULETTE_MIN_ORDER, prize.getMaxDiscount(), ROULETTE_COUPON_DAYS);
        return new SpinResult(prize.name(), prize.getLabel(), prize.getRate(),
                coupon == null ? null : CouponResponse.from(coupon), message, nextAvailableAt(today));
    }

    /** 신규 가입 이벤트: 가입한 회원이면 누구나 한 번 받을 수 있습니다. */
    @Transactional
    public CouponResponse claimWelcome(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));
        return couponService.claimWelcome(member);
    }

    private Optional<Event> rouletteEvent() {
        return eventRepository.findFirstByKindAndPublishedTrueOrderByIdDesc(EventKind.ROULETTE);
    }

    private static LocalDate today() {
        return LocalDate.now(SEOUL);
    }

    private static LocalDateTime nextAvailableAt(LocalDate today) {
        return today.plusDays(1).atStartOfDay();
    }
}
