package com.yeoun.order.service;

import com.yeoun.cart.service.CartService;
import com.yeoun.coupon.domain.Coupon;
import com.yeoun.coupon.repository.CouponRepository;
import com.yeoun.global.common.PageResponse;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.notification.domain.Notification.Type;
import com.yeoun.notification.service.NotificationService;
import com.yeoun.order.domain.Order;
import com.yeoun.order.domain.OrderItem;
import com.yeoun.order.domain.OrderStatus;
import com.yeoun.order.domain.ShippingPolicy;
import com.yeoun.order.dto.OrderDtos.CreateRequest;
import com.yeoun.order.dto.OrderDtos.OrderDetail;
import com.yeoun.order.dto.OrderDtos.OrderLine;
import com.yeoun.order.dto.OrderDtos.OrderSummary;
import com.yeoun.order.repository.OrderRepository;
import com.yeoun.product.domain.Product;
import com.yeoun.product.repository.ProductRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private static final DateTimeFormatter ORDER_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final MemberRepository memberRepository;
    private final CouponRepository couponRepository;
    private final CartService cartService;
    private final NotificationService notificationService;
    private final MockPaymentGateway paymentGateway;

    /** 주문서 작성 → 재고 차감 → 쿠폰·적립금 적용 → 모의 결제 승인까지 한 트랜잭션으로 처리합니다. */
    @Transactional
    public OrderDetail create(Long memberId, CreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));

        // 같은 상품이 여러 줄로 오면 수량을 합칩니다.
        Map<Long, Integer> quantities = request.items().stream()
                .collect(Collectors.toMap(OrderLine::productId, OrderLine::quantity, Integer::sum, LinkedHashMap::new));
        Map<Long, Product> products = productRepository.findAllForUpdate(quantities.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        if (products.size() != quantities.size()) {
            throw ApiException.notFound("주문할 수 없는 상품이 포함되어 있습니다.");
        }

        Order order = Order.builder()
                .orderNumber(nextOrderNumber())
                .member(member)
                .ordererName(request.orderer().name().trim())
                .ordererPhone(request.orderer().phone())
                .ordererEmail(request.orderer().email().trim())
                .shippingAddress(request.shipping().toAddress())
                .deliveryMemo(request.shipping().memo())
                .paymentMethod(request.paymentMethod())
                .paymentProvider(request.paymentProvider())
                .build();
        quantities.forEach((productId, quantity) -> {
            Product product = products.get(productId);
            product.decreaseStock(quantity);
            order.addItem(new OrderItem(product, quantity));
        });

        Coupon coupon = null;
        int couponDiscount = 0;
        if (request.couponId() != null) {
            coupon = couponRepository.findById(request.couponId())
                    .orElseThrow(() -> ApiException.notFound("쿠폰을 찾을 수 없습니다."));
            couponDiscount = coupon.use(memberId, order.getItemsAmount());
        }
        int usePoint = request.usePoint();
        if (usePoint > order.getItemsAmount() - couponDiscount) {
            throw ApiException.badRequest("적립금은 상품 금액을 넘어 사용할 수 없어요.");
        }
        member.usePoint(usePoint);
        order.applyDiscounts(coupon, couponDiscount, usePoint, ShippingPolicy.feeFor(order.getItemsAmount()));
        order.markPaid(paymentGateway.approve(request.paymentMethod(), order.getTotalAmount()));
        orderRepository.save(order);

        if (request.fromCart()) {
            cartService.removeOrdered(memberId, quantities.keySet());
        }
        if (request.saveAsDefaultAddress()) {
            member.changeAddress(request.shipping().toAddress());
        }
        notificationService.notify(member, Type.ORDER_STATUS,
                "주문 %s 결제가 완료되었어요. 향을 정성껏 준비할게요.".formatted(order.getOrderNumber()),
                "/mypage/orders/" + order.getId());
        return OrderDetail.from(order);
    }

    public PageResponse<OrderSummary> findMine(Long memberId, OrderStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return PageResponse.of(status == null
                ? orderRepository.findAllByMemberIdOrderByCreatedAtDescIdDesc(memberId, pageable)
                : orderRepository.findAllByMemberIdAndStatusOrderByCreatedAtDescIdDesc(memberId, status, pageable),
                OrderSummary::from);
    }

    public OrderDetail findOne(Long memberId, Long orderId, boolean admin) {
        Order order = get(orderId);
        if (!admin && !order.isOwnedBy(memberId)) {
            throw ApiException.forbidden("본인의 주문만 조회할 수 있습니다.");
        }
        return OrderDetail.from(order);
    }

    @Transactional
    public OrderDetail cancelByMember(Long memberId, Long orderId) {
        Order order = get(orderId);
        if (!order.isOwnedBy(memberId)) {
            throw ApiException.forbidden("본인의 주문만 취소할 수 있습니다.");
        }
        cancel(order, false);
        return OrderDetail.from(order);
    }

    public PageResponse<OrderSummary> findAll(OrderStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return PageResponse.of(status == null
                ? orderRepository.findAllByOrderByCreatedAtDescIdDesc(pageable)
                : orderRepository.findAllByStatusOrderByCreatedAtDescIdDesc(status, pageable), OrderSummary::from);
    }

    /** 운영자 주문 상태 변경. 배송 완료 시 적립금 지급과 등급 산정을 함께 처리합니다. */
    @Transactional
    public OrderDetail changeStatus(Long orderId, OrderStatus target) {
        Order order = get(orderId);
        if (target == OrderStatus.CANCELLED) {
            cancel(order, true);
        } else {
            order.advanceTo(target);
            if (target == OrderStatus.DELIVERED) {
                Member member = order.getMember();
                member.addPoint(order.earnPoint());
                orderRepository.flush();
                member.upgradeGradeBySpending(
                        orderRepository.sumTotalAmount(member.getId(), OrderStatus.DELIVERED).longValue());
            }
        }
        notificationService.notify(order.getMember(), Type.ORDER_STATUS,
                "주문 %s 상태가 '%s'(으)로 바뀌었어요.".formatted(order.getOrderNumber(), order.getStatus().getLabel()),
                "/mypage/orders/" + order.getId());
        return OrderDetail.from(order);
    }

    private void cancel(Order order, boolean byAdmin) {
        order.cancel(byAdmin);
        List<Long> productIds = order.getItems().stream().map(item -> item.getProduct().getId()).toList();
        Map<Long, Product> products = productRepository.findAllForUpdate(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        order.getItems().forEach(item -> products.get(item.getProduct().getId()).increaseStock(item.getQuantity()));
        if (order.getCoupon() != null) {
            order.getCoupon().restore();
        }
        order.getMember().addPoint(order.getPointUsed());
    }

    private Order get(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("주문을 찾을 수 없습니다."));
    }

    /** YN-20261018-4821 형식 */
    private String nextOrderNumber() {
        String date = LocalDate.now().format(ORDER_DATE);
        for (int attempt = 0; attempt < 20; attempt++) {
            String candidate = "YN-%s-%04d".formatted(date, ThreadLocalRandom.current().nextInt(10_000));
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("주문 번호를 만들 수 없습니다.");
    }
}
