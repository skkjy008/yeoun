package com.yeoun.order.controller;

import com.yeoun.global.common.PageResponse;
import com.yeoun.global.security.AuthMember;
import com.yeoun.member.domain.Role;
import com.yeoun.order.domain.OrderStatus;
import com.yeoun.order.dto.OrderDtos.CreateRequest;
import com.yeoun.order.dto.OrderDtos.OrderDetail;
import com.yeoun.order.dto.OrderDtos.OrderSummary;
import com.yeoun.order.dto.OrderDtos.StatusRequest;
import com.yeoun.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/api/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDetail create(@AuthenticationPrincipal AuthMember me, @Valid @RequestBody CreateRequest request) {
        return orderService.create(me.id(), request);
    }

    @GetMapping("/api/orders")
    public PageResponse<OrderSummary> mine(@AuthenticationPrincipal AuthMember me,
                                           @RequestParam(required = false) OrderStatus status,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return orderService.findMine(me.id(), status, page, Math.min(size, 50));
    }

    @GetMapping("/api/orders/{orderId}")
    public OrderDetail detail(@AuthenticationPrincipal AuthMember me, @PathVariable Long orderId) {
        return orderService.findOne(me.id(), orderId, me.role() == Role.ADMIN);
    }

    @PostMapping("/api/orders/{orderId}/cancel")
    public OrderDetail cancel(@AuthenticationPrincipal AuthMember me, @PathVariable Long orderId) {
        return orderService.cancelByMember(me.id(), orderId);
    }

    @GetMapping("/api/admin/orders")
    public PageResponse<OrderSummary> all(@RequestParam(required = false) OrderStatus status,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return orderService.findAll(status, page, Math.min(size, 100));
    }

    @PatchMapping("/api/admin/orders/{orderId}/status")
    public OrderDetail changeStatus(@PathVariable Long orderId, @Valid @RequestBody StatusRequest request) {
        return orderService.changeStatus(orderId, request.status());
    }
}
