package com.yeoun.order.dto;

import com.yeoun.member.domain.Address;
import com.yeoun.order.domain.Order;
import com.yeoun.order.domain.OrderItem;
import com.yeoun.order.domain.OrderStatus;
import com.yeoun.order.domain.PaymentMethod;
import com.yeoun.payment.dto.PaymentDtos.PaymentRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {
    }

    public record OrderLine(@NotNull Long productId, @Min(1) @Max(10) int quantity) {
    }

    public record Orderer(@NotBlank(message = "주문자 이름을 입력해 주세요.") @Size(max = 40) String name,
                          @NotBlank(message = "휴대전화 번호를 입력해 주세요.")
                          @Pattern(regexp = "^[0-9-]{9,13}$", message = "휴대전화 번호 형식을 확인해 주세요.") String phone,
                          @NotBlank(message = "이메일을 입력해 주세요.") @Email @Size(max = 120) String email) {
    }

    public record Shipping(@NotBlank(message = "받는 분을 입력해 주세요.") @Size(max = 40) String recipientName,
                           @NotBlank(message = "받는 분 연락처를 입력해 주세요.")
                           @Pattern(regexp = "^[0-9-]{9,13}$", message = "연락처 형식을 확인해 주세요.") String recipientPhone,
                           @NotBlank(message = "우편번호를 입력해 주세요.") @Size(max = 10) String zipCode,
                           @NotBlank(message = "기본 주소를 입력해 주세요.") @Size(max = 200) String address1,
                           @Size(max = 200) String address2,
                           @Size(max = 100) String memo) {

        public Address toAddress() {
            return new Address(recipientName, recipientPhone, zipCode, address1, address2);
        }
    }

    public record CreateRequest(
            @NotEmpty(message = "주문할 상품이 없습니다.") @Size(max = 20) List<@Valid OrderLine> items,
            boolean fromCart,
            @NotNull @Valid Orderer orderer,
            @NotNull @Valid Shipping shipping,
            boolean saveAsDefaultAddress,
            @NotNull(message = "결제수단을 선택해 주세요.") PaymentMethod paymentMethod,
            @Size(max = 30) String paymentProvider,
            Long couponId,
            @Min(0) int usePoint,
            @AssertTrue(message = "주문 내용 확인 및 결제 진행에 동의해 주세요.") boolean agreed) {
    }

    public record StatusRequest(@NotNull OrderStatus status) {
    }

    /** 주문서 제출 결과: 결제 대기 주문 + PG 결제창 정보 (결제 금액이 0원이면 payment는 null) */
    public record CheckoutResponse(OrderDetail order, PaymentRequest payment) {
    }

    public record OrderItemResponse(Long productId, String name, String typeLabel, String volume, String imageUrl,
                                    int unitPrice, int quantity, int lineAmount) {

        public static OrderItemResponse from(OrderItem i) {
            return new OrderItemResponse(i.getProduct().getId(), i.getProductName(), i.getTypeLabel(),
                    i.getVolume(), i.getImageUrl(), i.getUnitPrice(), i.getQuantity(), i.getLineAmount());
        }
    }

    public record OrderSummary(Long id, String orderNumber, String status, String statusLabel, String firstItemName,
                               String firstItemImage, int itemCount, int totalQuantity, int totalAmount,
                               boolean cancellable, String memberName, LocalDateTime createdAt,
                               List<OrderItemResponse> items) {

        public static OrderSummary from(Order o) {
            List<OrderItemResponse> items = o.getItems().stream().map(OrderItemResponse::from).toList();
            OrderItemResponse first = items.isEmpty() ? null : items.get(0);
            return new OrderSummary(o.getId(), o.getOrderNumber(), o.getStatus().name(), o.getStatus().getLabel(),
                    first == null ? null : first.name(), first == null ? null : first.imageUrl(), items.size(),
                    o.getTotalQuantity(), o.getTotalAmount(), o.getStatus().isCancellableByMember(),
                    o.getMember().getName(), o.getCreatedAt(), items);
        }
    }

    public record OrderDetail(Long id, String orderNumber, String status, String statusLabel, boolean cancellable,
                              String ordererName, String ordererPhone, String ordererEmail,
                              String recipientName, String recipientPhone, String zipCode, String address1,
                              String address2, String deliveryMemo, String paymentMethod, String paymentMethodLabel,
                              String paymentProvider, String paymentApprovalNo, int itemsAmount, int couponDiscount,
                              String couponName, int pointUsed, int shippingFee, int totalAmount, int earnedPoint,
                              LocalDateTime createdAt, LocalDateTime paidAt, LocalDateTime cancelledAt,
                              List<OrderItemResponse> items) {

        public static OrderDetail from(Order o) {
            Address a = o.getShippingAddress();
            return new OrderDetail(o.getId(), o.getOrderNumber(), o.getStatus().name(), o.getStatus().getLabel(),
                    o.getStatus().isCancellableByMember(), o.getOrdererName(), o.getOrdererPhone(),
                    o.getOrdererEmail(), a.getRecipientName(), a.getRecipientPhone(), a.getZipCode(),
                    a.getAddress1(), a.getAddress2(), o.getDeliveryMemo(), o.getPaymentMethod().name(),
                    o.getPaymentMethod().getLabel(), o.getPaymentProvider(), o.getPaymentApprovalNo(),
                    o.getItemsAmount(), o.getCouponDiscount(), o.getCoupon() == null ? null : o.getCoupon().getName(),
                    o.getPointUsed(), o.getShippingFee(), o.getTotalAmount(), o.getEarnedPoint(), o.getCreatedAt(),
                    o.getPaidAt(), o.getCancelledAt(),
                    o.getItems().stream().map(OrderItemResponse::from).toList());
        }
    }
}
