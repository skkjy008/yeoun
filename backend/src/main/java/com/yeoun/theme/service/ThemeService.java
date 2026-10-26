package com.yeoun.theme.service;

import com.yeoun.global.exception.ApiException;
import com.yeoun.product.domain.Product;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.product.repository.ProductRepository;
import com.yeoun.theme.domain.Theme;
import com.yeoun.theme.dto.ThemeDtos.ThemeDetail;
import com.yeoun.theme.dto.ThemeDtos.ThemeItem;
import com.yeoun.theme.dto.ThemeDtos.ThemeItemRequest;
import com.yeoun.theme.dto.ThemeDtos.ThemeRequest;
import com.yeoun.theme.dto.ThemeDtos.ThemeSummary;
import com.yeoun.theme.repository.ThemeRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ThemeService {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final ThemeRepository themeRepository;
    private final ProductRepository productRepository;

    /** 공개 테마: 지금 기간인 테마를 먼저, 그다음 지난·예정 테마 */
    public List<ThemeSummary> published() {
        LocalDate today = LocalDate.now(SEOUL);
        return themeRepository.findAllByPublishedTrueOrderBySortOrderAscIdAsc().stream()
                .map(t -> ThemeSummary.of(t, t.isActiveOn(today)))
                .sorted(Comparator.comparing(ThemeSummary::active).reversed())
                .toList();
    }

    public ThemeDetail detail(String slug, boolean admin) {
        Theme theme = themeRepository.findBySlug(slug)
                .filter(t -> admin || t.isPublished())
                .orElseThrow(() -> ApiException.notFound("테마를 찾을 수 없습니다."));
        LocalDate today = LocalDate.now(SEOUL);
        List<ThemeItem> items = theme.getProducts().stream()
                .filter(tp -> tp.getProduct().isActive())
                .map(tp -> new ThemeItem(ProductSummary.from(tp.getProduct()), tp.getNote()))
                .toList();
        List<ThemeSummary> others = published().stream()
                .filter(o -> !o.slug().equals(slug))
                .limit(3)
                .toList();
        return new ThemeDetail(ThemeSummary.of(theme, theme.isActiveOn(today)), theme.getStory(), items, others);
    }

    public List<ThemeSummary> all() {
        LocalDate today = LocalDate.now(SEOUL);
        return themeRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(t -> ThemeSummary.of(t, t.isActiveOn(today)))
                .toList();
    }

    @Transactional
    public ThemeDetail create(ThemeRequest request) {
        if (themeRepository.existsBySlug(request.slug())) {
            throw ApiException.conflict("이미 쓰고 있는 테마 주소입니다.");
        }
        validatePeriod(request);
        Theme theme = new Theme(request.toSpec());
        applyItems(theme, request.items());
        themeRepository.save(theme);
        return detail(theme.getSlug(), true);
    }

    @Transactional
    public ThemeDetail update(Long id, ThemeRequest request) {
        Theme theme = themeRepository.findById(id).orElseThrow(() -> ApiException.notFound("테마를 찾을 수 없습니다."));
        themeRepository.findBySlug(request.slug())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw ApiException.conflict("이미 쓰고 있는 테마 주소입니다.");
                });
        validatePeriod(request);
        theme.apply(request.toSpec());
        applyItems(theme, request.items());
        themeRepository.flush();
        return detail(theme.getSlug(), true);
    }

    @Transactional
    public void delete(Long id) {
        themeRepository.delete(themeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("테마를 찾을 수 없습니다.")));
    }

    private void applyItems(Theme theme, List<ThemeItemRequest> items) {
        // 같은 상품이 두 번 오면 처음 것만 씁니다.
        Map<Long, ThemeItemRequest> unique = new LinkedHashMap<>();
        (items == null ? List.<ThemeItemRequest>of() : items).forEach(i -> unique.putIfAbsent(i.productId(), i));
        Map<Long, Product> products = productRepository.findAllById(unique.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        if (products.size() != unique.size()) {
            throw ApiException.notFound("테마에 담을 수 없는 상품이 있습니다.");
        }
        List<ThemeItemRequest> ordered = List.copyOf(unique.values());
        theme.replaceProducts(ordered.stream().map(i -> products.get(i.productId())).toList(),
                ordered.stream().map(ThemeItemRequest::note).toList());
    }

    private static void validatePeriod(ThemeRequest request) {
        if (request.startsOn() != null && request.endsOn() != null && request.endsOn().isBefore(request.startsOn())) {
            throw ApiException.badRequest("종료일은 시작일 이후여야 해요.");
        }
    }
}
