package com.yeoun.payment.dto;

import com.yeoun.payment.domain.Payment;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class PaymentDtos {

    private PaymentDtos() {
    }

    /** 프론트엔드가 PG 결제창(위젯)을 띄우는 데 필요한 정보 */
    public record PaymentRequest(String provider, String clientKey, String customerKey, String orderKey,
                                 String orderName, int amount, String customerName, String customerEmail,
                                 String targetType, Long targetId) {
    }

    public record ConfirmRequest(@NotBlank @Size(max = 200) String paymentKey,
                                 @NotBlank @Size(max = 64) String orderId,
                                 @Min(0) int amount) {
    }

    public record FailRequest(@NotBlank @Size(max = 64) String orderId, @Size(max = 60) String code,
                              @Size(max = 300) String message) {
    }

    public record PaymentResult(String orderKey, String status, String targetType, Long targetId, int amount,
                                String methodLabel, String receiptUrl, LocalDateTime approvedAt) {

        public static PaymentResult from(Payment p) {
            return new PaymentResult(p.getOrderKey(), p.getStatus().name(), p.getTargetType().name(),
                    p.getTargetId(), p.getAmount(), p.getMethodLabel(), p.getReceiptUrl(), p.getApprovedAt());
        }
    }

    public record PaymentConfig(String provider, String clientKey, String customerKey) {
    }
}
