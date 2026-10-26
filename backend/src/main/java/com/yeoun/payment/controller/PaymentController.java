package com.yeoun.payment.controller;

import com.yeoun.global.security.AuthMember;
import com.yeoun.payment.dto.PaymentDtos.ConfirmRequest;
import com.yeoun.payment.dto.PaymentDtos.FailRequest;
import com.yeoun.payment.dto.PaymentDtos.PaymentConfig;
import com.yeoun.payment.dto.PaymentDtos.PaymentResult;
import com.yeoun.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    /** 결제 방식(TOSS / MOCK)과 위젯 클라이언트 키 */
    @GetMapping("/config")
    public PaymentConfig config(@AuthenticationPrincipal AuthMember me) {
        return paymentService.config(me == null ? null : me.id());
    }

    /** 결제창 successUrl에서 받은 값으로 결제를 승인합니다. */
    @PostMapping("/confirm")
    public PaymentResult confirm(@AuthenticationPrincipal AuthMember me, @Valid @RequestBody ConfirmRequest request) {
        return paymentService.confirm(me.id(), request);
    }

    /** 결제창 failUrl(사용자 취소·인증 실패) */
    @PostMapping("/fail")
    public ResponseEntity<Void> fail(@AuthenticationPrincipal AuthMember me, @Valid @RequestBody FailRequest request) {
        paymentService.failByUser(me.id(), request.orderId(), request.code(), request.message());
        return ResponseEntity.noContent().build();
    }
}
