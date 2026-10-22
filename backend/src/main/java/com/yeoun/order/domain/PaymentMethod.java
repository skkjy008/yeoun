package com.yeoun.order.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentMethod {
    CARD("신용 / 체크카드"),
    TRANSFER("계좌이체"),
    EASY_PAY("간편결제");

    private final String label;
}
