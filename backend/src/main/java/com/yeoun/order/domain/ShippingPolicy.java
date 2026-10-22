package com.yeoun.order.domain;

/** 배송비 정책: 50,000원 이상 무료, 미만이면 3,000원 */
public final class ShippingPolicy {

    public static final int FREE_THRESHOLD = 50_000;
    public static final int FEE = 3_000;

    private ShippingPolicy() {
    }

    public static int feeFor(int itemsAmount) {
        return itemsAmount == 0 || itemsAmount >= FREE_THRESHOLD ? 0 : FEE;
    }
}
