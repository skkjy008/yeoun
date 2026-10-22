package com.yeoun.cart.service;

import com.yeoun.cart.domain.CartItem;
import com.yeoun.cart.dto.CartDtos.AddRequest;
import com.yeoun.cart.dto.CartDtos.CartItemResponse;
import com.yeoun.cart.dto.CartDtos.CartResponse;
import com.yeoun.cart.repository.CartItemRepository;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.order.domain.ShippingPolicy;
import com.yeoun.product.domain.Product;
import com.yeoun.product.repository.ProductRepository;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;

    public CartResponse findMine(Long memberId) {
        List<CartItemResponse> items = cartItemRepository.findAllByMemberIdOrderByCreatedAtDescIdDesc(memberId)
                .stream()
                .filter(item -> item.getProduct().isActive())
                .map(CartItemResponse::from)
                .toList();
        int itemsAmount = items.stream().filter(CartItemResponse::available).mapToInt(CartItemResponse::lineAmount)
                .sum();
        return new CartResponse(items, itemsAmount, ShippingPolicy.feeFor(itemsAmount),
                ShippingPolicy.FREE_THRESHOLD);
    }

    public long count(Long memberId) {
        return cartItemRepository.countByMemberId(memberId);
    }

    @Transactional
    public CartResponse add(Long memberId, AddRequest request) {
        Product product = productRepository.findById(request.productId())
                .filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."));
        if (product.isSoldOut()) {
            throw ApiException.badRequest("품절된 상품은 담을 수 없어요.");
        }
        cartItemRepository.findByMemberIdAndProductId(memberId, product.getId())
                .ifPresentOrElse(item -> item.addQuantity(request.quantity()), () -> {
                    Member member = memberRepository.getReferenceById(memberId);
                    cartItemRepository.save(new CartItem(member, product, request.quantity()));
                });
        return findMine(memberId);
    }

    @Transactional
    public CartResponse changeQuantity(Long memberId, Long cartItemId, int quantity) {
        getOwned(memberId, cartItemId).changeQuantity(quantity);
        return findMine(memberId);
    }

    @Transactional
    public CartResponse remove(Long memberId, Collection<Long> cartItemIds) {
        cartItemRepository.deleteAll(cartItemRepository.findAllByMemberIdAndIdIn(memberId, cartItemIds));
        return findMine(memberId);
    }

    /** 주문이 끝난 장바구니 상품을 정리합니다. */
    @Transactional
    public void removeOrdered(Long memberId, Collection<Long> productIds) {
        cartItemRepository.findAllByMemberIdOrderByCreatedAtDescIdDesc(memberId).stream()
                .filter(item -> productIds.contains(item.getProduct().getId()))
                .forEach(cartItemRepository::delete);
    }

    private CartItem getOwned(Long memberId, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> ApiException.notFound("장바구니 상품을 찾을 수 없습니다."));
        if (!item.isOwnedBy(memberId)) {
            throw ApiException.forbidden("본인의 장바구니만 변경할 수 있습니다.");
        }
        return item;
    }
}
