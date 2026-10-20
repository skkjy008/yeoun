package com.yeoun.review.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.member.domain.Member;
import com.yeoun.product.domain.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 제품 별 리뷰. 별점(1~5)과 함께 남깁니다. */
@Getter
@Entity
@Table(name = "review", indexes = @Index(name = "idx_review_product", columnList = "product_id"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private int rating;

    /** 메인 페이지 '나만의 향을 발견한 이야기'에 노출할 짧은 헤드라인 (선택) */
    @Column(length = 80)
    private String headline;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(nullable = false)
    private boolean featured;

    public Review(Product product, Member member, int rating, String headline, String content, boolean featured) {
        this.product = product;
        this.member = member;
        this.rating = rating;
        this.headline = headline;
        this.content = content;
        this.featured = featured;
    }

    public boolean isWrittenBy(Long memberId) {
        return member.getId().equals(memberId);
    }
}
