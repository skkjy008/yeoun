package com.yeoun.payment.service;

import com.yeoun.global.config.YeounProperties;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.payment.domain.Payment;
import com.yeoun.payment.domain.PaymentStatus;
import com.yeoun.payment.domain.PaymentTarget;
import com.yeoun.payment.dto.PaymentDtos.ConfirmRequest;
import com.yeoun.payment.dto.PaymentDtos.PaymentConfig;
import com.yeoun.payment.dto.PaymentDtos.PaymentRequest;
import com.yeoun.payment.dto.PaymentDtos.PaymentResult;
import com.yeoun.payment.gateway.PaymentGateway;
import com.yeoun.payment.gateway.PaymentGateway.Approval;
import com.yeoun.payment.gateway.PaymentGatewayException;
import com.yeoun.payment.repository.PaymentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

/**
 * 결제 흐름
 * 1) prepare  : 주문/커미션이 금액을 정하면 READY 결제를 만들고 결제창 정보를 돌려줍니다.
 * 2) confirm  : PG 인증 후 successUrl로 돌아온 paymentKey·orderId·amount를 검증하고 PG 승인 API를 호출합니다.
 * 3) fail     : 결제창에서 취소·실패하면 READY 결제를 ABORTED로 바꾸고 예약했던 재고 등을 돌려놓습니다.
 * 4) refund   : 주문 취소·커미션 환불 시 전액 또는 부분 취소합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private static final List<PaymentStatus> PAID = List.of(PaymentStatus.DONE, PaymentStatus.PARTIAL_CANCELED);

    private final PaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final PaymentGateway gateway;
    private final ApplicationEventPublisher eventPublisher;
    private final YeounProperties properties;

    /** 결제위젯 초기화 정보. 로그인한 회원이면 구매자 키(customerKey)도 함께 내려 줍니다. */
    @Transactional
    public PaymentConfig config(Long memberId) {
        String customerKey = memberId == null ? null
                : memberRepository.findById(memberId).map(Member::getCustomerKey).orElse(null);
        return new PaymentConfig(gateway.provider(), clientKey(), customerKey);
    }

    @Transactional
    public PaymentRequest prepare(Member member, PaymentTarget target, Long targetId, Long targetRef,
                                  String orderKey, String orderName, int amount) {
        if (amount <= 0) {
            throw ApiException.badRequest("결제 금액이 올바르지 않습니다.");
        }
        Payment payment = paymentRepository.save(Payment.builder()
                .member(member)
                .targetType(target)
                .targetId(targetId)
                .targetRef(targetRef)
                .orderKey(orderKey)
                .orderName(orderName.length() > 100 ? orderName.substring(0, 100) : orderName)
                .provider(gateway.provider())
                .amount(amount)
                .build());
        return toRequest(payment);
    }

    public PaymentRequest toRequest(Payment payment) {
        Member member = payment.getMember();
        return new PaymentRequest(payment.getProvider(), clientKey(), member.getCustomerKey(), payment.getOrderKey(),
                payment.getOrderName(), payment.getAmount(), member.getName(), member.getEmail(),
                payment.getTargetType().name(), payment.getTargetId());
    }

    /** 결제 승인. 금액 위변조를 막기 위해 서버에 저장한 금액과 비교한 뒤 PG 승인 API를 호출합니다. */
    @Transactional(noRollbackFor = ApiException.class)
    public PaymentResult confirm(Long memberId, ConfirmRequest request) {
        Payment payment = paymentRepository.findByOrderKey(request.orderId())
                .orElseThrow(() -> ApiException.notFound("결제 정보를 찾을 수 없습니다."));
        if (!payment.isOwnedBy(memberId)) {
            throw ApiException.forbidden("본인의 결제만 승인할 수 있습니다.");
        }
        if (payment.getStatus() == PaymentStatus.DONE && request.paymentKey().equals(payment.getPaymentKey())) {
            return PaymentResult.from(payment); // 새로고침 등으로 같은 요청이 다시 와도 한 번만 승인
        }
        if (payment.getStatus() != PaymentStatus.READY) {
            throw ApiException.conflict("이미 처리되었거나 만료된 결제입니다. 주문서를 다시 작성해 주세요.");
        }
        if (payment.getAmount() != request.amount()) {
            fail(payment, "AMOUNT_MISMATCH", "결제 금액이 주문 금액과 다릅니다.");
            throw ApiException.badRequest("결제 금액이 주문 금액과 다릅니다.");
        }

        Approval approval;
        try {
            approval = gateway.confirm(request.paymentKey(), payment.getOrderKey(), payment.getAmount());
        } catch (PaymentGatewayException e) {
            fail(payment, e.getCode(), e.getMessage());
            throw new ApiException(HttpStatus.BAD_REQUEST, e.getCode(), e.getMessage());
        }
        try {
            payment.approve(approval.paymentKey(), approval.methodLabel(), approval.receiptUrl(), approval.approvedAt());
            eventPublisher.publishEvent(new PaymentEvents.Approved(payment));
            paymentRepository.flush();
        } catch (RuntimeException e) {
            // 승인은 됐는데 주문 처리에 실패하면 결제를 즉시 취소해 돈만 빠져나가는 일을 막습니다.
            log.error("[payment] 승인 후 처리 실패 → 결제 취소 orderKey={}", payment.getOrderKey(), e);
            safeCancel(approval.paymentKey(), "주문 처리 실패로 인한 자동 취소", null);
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            throw e instanceof ApiException api ? api
                    : ApiException.conflict("결제는 취소되었어요. 주문을 처리하지 못했습니다. 다시 시도해 주세요.");
        }
        return PaymentResult.from(payment);
    }

    @Transactional
    public void failByUser(Long memberId, String orderKey, String code, String message) {
        paymentRepository.findByOrderKey(orderKey)
                .filter(p -> p.isOwnedBy(memberId))
                .ifPresent(p -> fail(p, code == null ? "USER_CANCEL" : code, message));
    }

    /** 결제창을 띄우고 돌아오지 않은 결제는 일정 시간 뒤 만료시킵니다. */
    @Transactional
    public int expireStale() {
        LocalDateTime before = LocalDateTime.now().minusMinutes(properties.payment().pendingExpireMinutes());
        List<Payment> stale = paymentRepository.findAllByStatusAndCreatedAtBefore(PaymentStatus.READY, before);
        stale.forEach(p -> fail(p, "EXPIRED", "결제 시간이 지나 만료되었습니다."));
        return stale.size();
    }

    public Optional<Payment> findPaid(PaymentTarget target, Long targetId) {
        return paymentRepository.findFirstByTargetTypeAndTargetIdAndStatusInOrderByIdDesc(target, targetId, PAID);
    }

    /** 환불. amount가 null이면 남은 금액 전부를 취소합니다. 환불된 금액을 돌려줍니다. */
    @Transactional
    public int refund(PaymentTarget target, Long targetId, Integer amount, String reason) {
        Optional<Payment> found = findPaid(target, targetId);
        if (found.isEmpty()) {
            return 0; // 예시 데이터처럼 결제 기록이 없는 경우
        }
        Payment payment = found.get();
        int cancelAmount = amount == null ? payment.getRefundableAmount() : amount;
        if (cancelAmount <= 0) {
            return 0;
        }
        try {
            gateway.cancel(payment.getPaymentKey(), reason,
                    cancelAmount == payment.getRefundableAmount() && payment.getCanceledAmount() == 0 ? null : cancelAmount);
        } catch (PaymentGatewayException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, e.getCode(), "환불을 처리하지 못했어요: " + e.getMessage());
        }
        payment.cancel(cancelAmount);
        return cancelAmount;
    }

    private void fail(Payment payment, String code, String message) {
        if (payment.getStatus() != PaymentStatus.READY) {
            return;
        }
        payment.abort(code, message);
        eventPublisher.publishEvent(new PaymentEvents.Failed(payment));
    }

    private void safeCancel(String paymentKey, String reason, Integer amount) {
        try {
            gateway.cancel(paymentKey, reason, amount);
        } catch (RuntimeException e) {
            log.error("[payment] 자동 취소 실패 paymentKey={} — 수동 확인 필요", paymentKey, e);
        }
    }

    private String clientKey() {
        YeounProperties.Payment.Toss toss = properties.payment().toss();
        return toss.enabled() ? toss.clientKey() : null;
    }
}
