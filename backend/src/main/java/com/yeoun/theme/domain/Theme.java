package com.yeoun.theme.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.product.domain.Product;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 테마 큐레이션 (계절·기념일). 운영자가 만들고, 기간 안에 있는 테마가 먼저 노출됩니다. */
@Getter
@Entity
@Table(name = "theme")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Theme extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** URL에 쓰는 이름 (예: autumn-woody) */
    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Column(length = 60)
    private String eyebrow;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 200)
    private String subtitle;

    @Column(length = 2000)
    private String story;

    @Column(name = "hero_image_url", nullable = false, length = 300)
    private String heroImageUrl;

    @Column(name = "starts_on")
    private LocalDate startsOn;

    @Column(name = "ends_on")
    private LocalDate endsOn;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean published;

    @OneToMany(mappedBy = "theme", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder asc")
    private List<ThemeProduct> products = new ArrayList<>();

    public Theme(Spec spec) {
        apply(spec);
    }

    public void apply(Spec spec) {
        this.slug = spec.slug();
        this.eyebrow = spec.eyebrow();
        this.title = spec.title();
        this.subtitle = spec.subtitle();
        this.story = spec.story();
        this.heroImageUrl = spec.heroImageUrl();
        this.startsOn = spec.startsOn();
        this.endsOn = spec.endsOn();
        this.sortOrder = spec.sortOrder();
        this.published = spec.published();
    }

    /** 상품 구성을 통째로 바꿉니다. (순서대로 sortOrder 부여) */
    public void replaceProducts(List<Product> items, List<String> notes) {
        products.clear();
        for (int i = 0; i < items.size(); i++) {
            products.add(new ThemeProduct(this, items.get(i), i, notes.get(i)));
        }
    }

    /** 오늘이 기간 안인지 (기간이 없으면 상시) */
    public boolean isActiveOn(LocalDate today) {
        return (startsOn == null || !today.isBefore(startsOn)) && (endsOn == null || !today.isAfter(endsOn));
    }

    public record Spec(String slug, String eyebrow, String title, String subtitle, String story, String heroImageUrl,
                       LocalDate startsOn, LocalDate endsOn, int sortOrder, boolean published) {
    }
}
