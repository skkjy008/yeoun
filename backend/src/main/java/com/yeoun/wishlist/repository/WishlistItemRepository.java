package com.yeoun.wishlist.repository;

import com.yeoun.wishlist.domain.WishlistItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @EntityGraph(attributePaths = "product")
    List<WishlistItem> findAllByMemberIdOrderByCreatedAtDescIdDesc(Long memberId);

    Optional<WishlistItem> findByMemberIdAndProductId(Long memberId, Long productId);
}
