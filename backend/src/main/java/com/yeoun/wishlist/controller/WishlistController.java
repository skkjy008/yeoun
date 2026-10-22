package com.yeoun.wishlist.controller;

import com.yeoun.global.security.AuthMember;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.wishlist.service.WishlistService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public List<ProductSummary> mine(@AuthenticationPrincipal AuthMember me) {
        return wishlistService.findMine(me.id());
    }

    @GetMapping("/ids")
    public List<Long> myProductIds(@AuthenticationPrincipal AuthMember me) {
        return wishlistService.findMyProductIds(me.id());
    }

    @PutMapping("/{productId}")
    public ResponseEntity<Void> add(@AuthenticationPrincipal AuthMember me, @PathVariable Long productId) {
        wishlistService.add(me.id(), productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal AuthMember me, @PathVariable Long productId) {
        wishlistService.remove(me.id(), productId);
        return ResponseEntity.noContent().build();
    }
}
