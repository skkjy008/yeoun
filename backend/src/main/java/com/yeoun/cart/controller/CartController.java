package com.yeoun.cart.controller;

import com.yeoun.cart.dto.CartDtos.AddRequest;
import com.yeoun.cart.dto.CartDtos.CartResponse;
import com.yeoun.cart.dto.CartDtos.QuantityRequest;
import com.yeoun.cart.service.CartService;
import com.yeoun.global.security.AuthMember;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse mine(@AuthenticationPrincipal AuthMember me) {
        return cartService.findMine(me.id());
    }

    @GetMapping("/count")
    public Map<String, Long> count(@AuthenticationPrincipal AuthMember me) {
        return Map.of("count", cartService.count(me.id()));
    }

    @PostMapping("/items")
    public CartResponse add(@AuthenticationPrincipal AuthMember me, @Valid @RequestBody AddRequest request) {
        return cartService.add(me.id(), request);
    }

    @PatchMapping("/items/{cartItemId}")
    public CartResponse changeQuantity(@AuthenticationPrincipal AuthMember me, @PathVariable Long cartItemId,
                                       @Valid @RequestBody QuantityRequest request) {
        return cartService.changeQuantity(me.id(), cartItemId, request.quantity());
    }

    @DeleteMapping("/items")
    public CartResponse remove(@AuthenticationPrincipal AuthMember me, @RequestParam List<Long> ids) {
        return cartService.remove(me.id(), ids);
    }
}
