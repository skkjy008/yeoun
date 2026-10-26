package com.yeoun.theme.dto;

import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.theme.domain.Theme;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public final class ThemeDtos {

    private ThemeDtos() {
    }

    public record ThemeItemRequest(@NotNull Long productId, @Size(max = 200) String note) {
    }

    public record ThemeRequest(
            @NotBlank @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "주소는 영문 소문자·숫자·하이픈만 쓸 수 있어요.")
            @Size(max = 60) String slug,
            @Size(max = 60) String eyebrow,
            @NotBlank(message = "테마 제목을 입력해 주세요.") @Size(max = 120) String title,
            @Size(max = 200) String subtitle,
            @Size(max = 2000) String story,
            @NotBlank(message = "대표 이미지를 올려 주세요.") @Size(max = 300) String heroImageUrl,
            LocalDate startsOn,
            LocalDate endsOn,
            int sortOrder,
            boolean published,
            @Size(max = 12, message = "상품은 12개까지 묶을 수 있어요.") List<@Valid ThemeItemRequest> items) {

        public Theme.Spec toSpec() {
            return new Theme.Spec(slug, eyebrow, title, subtitle, story, heroImageUrl, startsOn, endsOn, sortOrder,
                    published);
        }
    }

    public record ThemeItem(ProductSummary product, String note) {
    }

    public record ThemeSummary(Long id, String slug, String eyebrow, String title, String subtitle,
                               String heroImageUrl, LocalDate startsOn, LocalDate endsOn, boolean active,
                               boolean published, int sortOrder, int productCount, List<String> previewImages) {

        public static ThemeSummary of(Theme t, boolean active) {
            return new ThemeSummary(t.getId(), t.getSlug(), t.getEyebrow(), t.getTitle(), t.getSubtitle(),
                    t.getHeroImageUrl(), t.getStartsOn(), t.getEndsOn(), active, t.isPublished(), t.getSortOrder(),
                    t.getProducts().size(),
                    t.getProducts().stream().limit(3).map(tp -> tp.getProduct().getImageUrl()).toList());
        }
    }

    public record ThemeDetail(ThemeSummary summary, String story, List<ThemeItem> items,
                              List<ThemeSummary> others) {
    }
}
