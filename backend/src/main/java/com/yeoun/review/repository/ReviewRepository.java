package com.yeoun.review.repository;

import com.yeoun.review.domain.Review;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = "member")
    Page<Review> findAllByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    @EntityGraph(attributePaths = {"member", "product"})
    List<Review> findTop3ByFeaturedTrueOrderByCreatedAtDescIdDesc();

    @EntityGraph(attributePaths = {"member", "product"})
    List<Review> findAllByMemberIdOrderByCreatedAtDescIdDesc(Long memberId);

    long countByProductId(Long productId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.product.id = :productId")
    double averageRating(@Param("productId") Long productId);
}
