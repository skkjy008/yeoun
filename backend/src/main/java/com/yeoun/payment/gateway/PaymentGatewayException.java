package com.yeoun.payment.gateway;

import lombok.Getter;

/** PG가 승인·취소를 거절했을 때 (코드와 메시지를 그대로 사용자에게 보여 줍니다) */
@Getter
public class PaymentGatewayException extends RuntimeException {

    private final String code;

    public PaymentGatewayException(String code, String message) {
        super(message);
        this.code = code;
    }
}
