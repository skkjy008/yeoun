package com.yeoun.event.service;

import com.yeoun.event.domain.Event;
import com.yeoun.event.domain.EventKind;
import com.yeoun.event.repository.EventRepository;
import com.yeoun.product.domain.Product;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.theme.domain.Theme;
import com.yeoun.theme.domain.ThemeProduct;
import com.yeoun.theme.repository.ThemeRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테마 특가 가격 계산.
 * 오늘(한국 시간) 진행 중인 THEME_SALE 이벤트가 가리키는 테마의 상품에 할인율을 적용합니다.
 * 한 상품이 여러 특가에 걸리면 가장 큰 할인율 하나만 적용합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalePricing {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final EventRepository eventRepository;
    private final ThemeRepository themeRepository;

    /** 상품 id → 할인율(%) */
    public Map<Long, Integer> activeRates() {
        LocalDate today = LocalDate.now(SEOUL);
        Map<Long, Integer> rates = new HashMap<>();
        for (Event event : eventRepository.findAllByKindAndPublishedTrue(EventKind.THEME_SALE)) {
            Integer rate = event.getDiscountRate();
            if (rate == null || rate <= 0 || event.getThemeSlug() == null || !event.isActiveOn(today)) {
                continue;
            }
            themeRepository.findBySlug(event.getThemeSlug())
                    .filter(Theme::isPublished)
                    .ifPresent(theme -> theme.getProducts().stream()
                            .map(ThemeProduct::getProduct)
                            .forEach(p -> rates.merge(p.getId(), rate, Math::max)));
        }
        return rates;
    }

    public int rateOf(Long productId) {
        return activeRates().getOrDefault(productId, 0);
    }

    /** 목록 응답용: 할인율을 한 번만 계산해 여러 상품에 씁니다. */
    public Function<Product, ProductSummary> summaries() {
        Map<Long, Integer> rates = activeRates();
        return p -> ProductSummary.from(p, rates.getOrDefault(p.getId(), 0));
    }

    /** 할인 금액은 10원 단위 절사 (쿠폰과 같은 규칙) */
    public static int salePrice(int price, int rate) {
        if (rate <= 0) {
            return price;
        }
        int discount = (int) ((long) price * Math.min(rate, 100) / 100 / 10 * 10);
        return price - discount;
    }
}
