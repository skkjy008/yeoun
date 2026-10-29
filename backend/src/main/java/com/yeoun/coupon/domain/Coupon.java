package com.yeoun.coupon.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 회원에게 발급된 쿠폰. 정액 할인이며, 최소 주문 금액 이상일 때 사용할 수 있습니다. */
@Getter
@Entity
@Table(name = "coupon", indexes = @Index(name = "idx_coupon_member", columnList = "member_id"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Coupon extends BaseTimeEntity {

    public static final String WELCOME = "WELCOME";
    public static final String ROULETTE = "ROULETTE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    /** 발급 사유 코드 (WELCOME, EVENT ...) */
    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "discount_amount", nullable = false)
    private int discountAmount;

    @Column(name = "min_order_amount", nullable = false)
    private int minOrderAmount;

    /** 정률 할인(%) 쿠폰이면 할인율. 정액 쿠폰은 null */
    @Column(name = "discount_rate")
    private Integer discountRate;

    /** 정률 할인 쿠폰의 최대 할인 금액 */
    @Column(name = "max_discount_amount")
    private Integer maxDiscountAmount;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public Coupon(Member member, String code, String name, int discountAmount, int minOrderAmount,
                  LocalDateTime expiresAt) {
        this.member = member;
        this.code = code;
        this.name = name;
        this.discountAmount = discountAmount;
        this.minOrderAmount = minOrderAmount;
        this.expiresAt = expiresAt;
    }

    /** 정률(%) 할인 쿠폰 */
    public static Coupon percent(Member member, String code, String name, int rate, int maxDiscount,
                                 int minOrderAmount, LocalDateTime expiresAt) {
        Coupon coupon = new Coupon(member, code, name, 0, minOrderAmount, expiresAt);
        coupon.discountRate = rate;
        coupon.maxDiscountAmount = maxDiscount;
        return coupon;
    }

    public boolean isPercent() {
        return discountRate != null && discountRate > 0;
    }

    /** 이 주문 금액에 적용했을 때의 할인 금액 (정률은 10원 단위 내림, 최대 할인 금액까지) */
    public int discountFor(int orderAmount) {
        if (!isPercent()) {
            return Math.min(discountAmount, orderAmount);
        }
        int discount = orderAmount * discountRate / 100 / 10 * 10;
        if (maxDiscountAmount != null) {
            discount = Math.min(discount, maxDiscountAmount);
        }
        return Math.min(discount, orderAmount);
    }

    public static Coupon welcome(Member member) {
        return new Coupon(member, WELCOME, "첫 향을 위한 환영 쿠폰", 3_000, 30_000,
                LocalDateTime.now().plusDays(30));
    }

    public boolean isUsable(LocalDateTime now) {
        return usedAt == null && expiresAt.isAfter(now);
    }

    /** 주문에 쿠폰을 적용하고 할인 금액을 돌려줍니다. */
    public int use(Long memberId, int orderAmount) {
        if (!member.getId().equals(memberId)) {
            throw ApiException.forbidden("본인의 쿠폰만 사용할 수 있습니다.");
        }
        if (!isUsable(LocalDateTime.now())) {
            throw ApiException.badRequest("이미 사용했거나 기간이 지난 쿠폰입니다.");
        }
        if (orderAmount < minOrderAmount) {
            throw ApiException.badRequest("%,d원 이상 주문할 때 사용할 수 있는 쿠폰입니다.".formatted(minOrderAmount));
        }
        this.usedAt = LocalDateTime.now();
        return discountFor(orderAmount);
    }

    /** 주문 취소 시 쿠폰을 되돌립니다. */
    public void restore() {
        this.usedAt = null;
    }
}
