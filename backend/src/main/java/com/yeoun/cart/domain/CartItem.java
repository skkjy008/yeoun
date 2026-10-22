package com.yeoun.cart.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 장바구니 상품. 회원 + 상품 조합은 하나만 존재하고, 다시 담으면 수량이 늘어납니다. */
@Getter
@Entity
@Table(name = "cart_item", uniqueConstraints = @UniqueConstraint(name = "uk_cart_member_product",
        columnNames = {"member_id", "product_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem extends BaseTimeEntity {

    public static final int MAX_QUANTITY = 10;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    public CartItem(Member member, Product product, int quantity) {
        this.member = member;
        this.product = product;
        changeQuantity(quantity);
    }

    public void changeQuantity(int quantity) {
        if (quantity < 1 || quantity > MAX_QUANTITY) {
            throw ApiException.badRequest("수량은 1~%d개까지 선택할 수 있어요.".formatted(MAX_QUANTITY));
        }
        this.quantity = quantity;
    }

    public void addQuantity(int quantity) {
        changeQuantity(Math.min(MAX_QUANTITY, this.quantity + quantity));
    }

    public boolean isOwnedBy(Long memberId) {
        return member.getId().equals(memberId);
    }
}
