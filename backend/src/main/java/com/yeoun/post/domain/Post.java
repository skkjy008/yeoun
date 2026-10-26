package com.yeoun.post.domain;

import com.yeoun.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 게시글 테이블. 운영자가 관리하는 메인 배너(테마 추천·이벤트)와 공지를 저장합니다.
 */
@Getter
@Entity
@Table(name = "post")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

    public enum Type { BANNER, NOTICE, EVENT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private Type type;

    @Column(length = 60)
    private String eyebrow;

    /** 줄바꿈(\n)으로 행을 구분합니다. */
    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 1000)
    private String body;

    @Column(name = "cta_label", length = 40)
    private String ctaLabel;

    @Column(name = "cta_link", length = 200)
    private String ctaLink;

    @Column(name = "image_url", length = 200)
    private String imageUrl;

    @Column(length = 80)
    private String caption;

    @Column(length = 120)
    private String footnote;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean published;

    public Post(Spec spec) {
        apply(spec);
    }

    public void apply(Spec s) {
        this.type = s.type();
        this.eyebrow = s.eyebrow();
        this.title = s.title();
        this.body = s.body();
        this.ctaLabel = s.ctaLabel();
        this.ctaLink = s.ctaLink();
        this.imageUrl = s.imageUrl();
        this.caption = s.caption();
        this.footnote = s.footnote();
        this.sortOrder = s.sortOrder();
        this.published = s.published();
    }

    public record Spec(Type type, String eyebrow, String title, String body, String ctaLabel, String ctaLink,
                       String imageUrl, String caption, String footnote, int sortOrder, boolean published) {
    }
}
