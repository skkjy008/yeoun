package com.yeoun.event.domain;

import com.yeoun.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 이벤트 (테마 특가 · 룰렛 · 신규 가입 쿠폰). 기간이 비어 있으면 상시 진행입니다. */
@Getter
@Entity
@Table(name = "event")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Event extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private EventKind kind;

    @Column(nullable = false, length = 100)
    private String title;

    /** 목록에 보이는 한두 줄 소개 */
    @Column(nullable = false, length = 300)
    private String summary;

    /** 상세 페이지 본문 */
    @Column(length = 2000)
    private String body;

    @Column(name = "thumbnail_url", nullable = false, length = 300)
    private String thumbnailUrl;

    @Column(name = "starts_on")
    private LocalDate startsOn;

    @Column(name = "ends_on")
    private LocalDate endsOn;

    /** 테마 특가 이벤트가 연결된 테마 주소 */
    @Column(name = "theme_slug", length = 60)
    private String themeSlug;

    /** 테마 특가 이벤트의 안내 할인율(%) */
    @Column(name = "discount_rate")
    private Integer discountRate;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean published;

    public Event(String slug, EventKind kind, String title, String summary, String body, String thumbnailUrl,
                 LocalDate startsOn, LocalDate endsOn, String themeSlug, Integer discountRate, int sortOrder) {
        this.slug = slug;
        this.kind = kind;
        this.title = title;
        this.summary = summary;
        this.body = body;
        this.thumbnailUrl = thumbnailUrl;
        this.startsOn = startsOn;
        this.endsOn = endsOn;
        this.themeSlug = themeSlug;
        this.discountRate = discountRate;
        this.sortOrder = sortOrder;
        this.published = true;
    }

    public boolean isActiveOn(LocalDate today) {
        return (startsOn == null || !today.isBefore(startsOn)) && (endsOn == null || !today.isAfter(endsOn));
    }

    public boolean isEndedOn(LocalDate today) {
        return endsOn != null && today.isAfter(endsOn);
    }
}
