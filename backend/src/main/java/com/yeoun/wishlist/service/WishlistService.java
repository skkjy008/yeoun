package com.yeoun.wishlist.service;

import com.yeoun.global.exception.ApiException;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.product.domain.Product;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.product.repository.ProductRepository;
import com.yeoun.wishlist.domain.WishlistItem;
import com.yeoun.wishlist.repository.WishlistItemRepository;
import java.util.List;
import com.yeoun.event.service.SalePricing;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;
    private final SalePricing salePricing;

    public List<ProductSummary> findMine(Long memberId) {
        return wishlistItemRepository.findAllByMemberIdOrderByCreatedAtDescIdDesc(memberId).stream()
                .map(WishlistItem::getProduct)
                .filter(Product::isActive)
                .map(salePricing.summaries())
                .toList();
    }

    public List<Long> findMyProductIds(Long memberId) {
        return wishlistItemRepository.findAllByMemberIdOrderByCreatedAtDescIdDesc(memberId).stream()
                .map(item -> item.getProduct().getId())
                .toList();
    }

    @Transactional
    public void add(Long memberId, Long productId) {
        if (wishlistItemRepository.findByMemberIdAndProductId(memberId, productId).isPresent()) {
            return;
        }
        Product product = productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."));
        wishlistItemRepository.save(new WishlistItem(memberRepository.getReferenceById(memberId), product));
    }

    @Transactional
    public void remove(Long memberId, Long productId) {
        wishlistItemRepository.findByMemberIdAndProductId(memberId, productId)
                .ifPresent(wishlistItemRepository::delete);
    }
}
