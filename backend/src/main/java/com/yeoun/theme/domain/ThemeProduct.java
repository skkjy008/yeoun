package com.yeoun.theme.domain;

import com.yeoun.product.domain.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 테마에 묶인 상품과 큐레이터 한 줄 소개 */
@Getter
@Entity
@Table(name = "theme_product")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ThemeProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theme_id", nullable = false)
    private Theme theme;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(length = 200)
    private String note;

    ThemeProduct(Theme theme, Product product, int sortOrder, String note) {
        this.theme = theme;
        this.product = product;
        this.sortOrder = sortOrder;
        this.note = note;
    }
}
