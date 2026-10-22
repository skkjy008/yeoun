package com.yeoun.cart.repository;

import com.yeoun.cart.domain.CartItem;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @EntityGraph(attributePaths = "product")
    List<CartItem> findAllByMemberIdOrderByCreatedAtDescIdDesc(Long memberId);

    Optional<CartItem> findByMemberIdAndProductId(Long memberId, Long productId);

    List<CartItem> findAllByMemberIdAndIdIn(Long memberId, Collection<Long> ids);

    long countByMemberId(Long memberId);
}
