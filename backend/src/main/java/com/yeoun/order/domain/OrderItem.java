package com.yeoun.order.domain;

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

/** 주문 상품. 이후 상품 정보가 바뀌어도 주문 내역이 유지되도록 이름·가격을 함께 저장합니다. */
@Getter
@Entity
@Table(name = "order_item")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "product_name", nullable = false, length = 60)
    private String productName;

    @Column(name = "type_label", nullable = false, length = 20)
    private String typeLabel;

    @Column(nullable = false, length = 20)
    private String volume;

    @Column(name = "image_url", nullable = false, length = 200)
    private String imageUrl;

    @Column(name = "unit_price", nullable = false)
    private int unitPrice;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "line_amount", nullable = false)
    private int lineAmount;

    public OrderItem(Product product, int quantity) {
        this.product = product;
        this.productName = product.getName();
        this.typeLabel = product.getTypeLabel();
        this.volume = product.getVolume();
        this.imageUrl = product.getImageUrl();
        this.unitPrice = product.getPrice();
        this.quantity = quantity;
        this.lineAmount = unitPrice * quantity;
    }

    void assignOrder(Order order) {
        this.order = order;
    }
}
