package com.yeoun.event.dto;

import com.yeoun.coupon.dto.CouponResponse;
import com.yeoun.event.domain.Event;
import com.yeoun.event.domain.RoulettePrize;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public final class EventDtos {

    private EventDtos() {
    }

    /** status: ONGOING(진행 중) · UPCOMING(예정) · ENDED(종료) */
    public record EventSummary(Long id, String slug, String kind, String title, String summary, String thumbnailUrl,
                               LocalDate startsOn, LocalDate endsOn, String status) {

        public static EventSummary of(Event e, LocalDate today) {
            String status = e.isActiveOn(today) ? "ONGOING" : e.isEndedOn(today) ? "ENDED" : "UPCOMING";
            return new EventSummary(e.getId(), e.getSlug(), e.getKind().name(), e.getTitle(), e.getSummary(),
                    e.getThumbnailUrl(), e.getStartsOn(), e.getEndsOn(), status);
        }
    }

    public record EventDetail(EventSummary summary, String body, String themeSlug, Integer discountRate) {

        public static EventDetail of(Event e, LocalDate today) {
            return new EventDetail(EventSummary.of(e, today), e.getBody(), e.getThemeSlug(), e.getDiscountRate());
        }
    }

    public record PrizeInfo(String code, String label, int rate, int maxDiscount, double probability) {

        public static List<PrizeInfo> all() {
            double total = RoulettePrize.totalWeight();
            return Arrays.stream(RoulettePrize.values())
                    .map(p -> new PrizeInfo(p.name(), p.getLabel(), p.getRate(), p.getMaxDiscount(),
                            Math.round(p.getWeight() / total * 1000) / 10.0))
                    .toList();
        }
    }

    /** 오늘 룰렛을 돌렸는지와 결과, 다음 참여 가능 시각 */
    public record RouletteStatus(boolean spunToday, String todayPrize, String todayPrizeLabel,
                                 LocalDateTime nextAvailableAt, boolean eventActive, List<PrizeInfo> prizes) {
    }

    public record SpinResult(String prize, String label, int rate, CouponResponse coupon, String message,
                             LocalDateTime nextAvailableAt) {
    }
}
