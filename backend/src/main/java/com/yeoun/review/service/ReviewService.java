package com.yeoun.review.service;

import com.yeoun.global.common.PageResponse;
import com.yeoun.global.exception.ApiException;
import com.yeoun.global.security.AuthMember;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.Role;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.product.domain.Product;
import com.yeoun.product.repository.ProductRepository;
import com.yeoun.review.domain.Review;
import com.yeoun.review.dto.ReviewDtos.ReviewRequest;
import com.yeoun.review.dto.ReviewDtos.ReviewResponse;
import com.yeoun.review.repository.ReviewRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final MemberRepository memberRepository;

    public PageResponse<ReviewResponse> findByProduct(Long productId, int page, int size) {
        return PageResponse.of(
                reviewRepository.findAllByProductIdOrderByCreatedAtDesc(productId, PageRequest.of(page, size)),
                ReviewResponse::from);
    }

    public List<ReviewResponse> featured() {
        return reviewRepository.findTop3ByFeaturedTrueOrderByCreatedAtDescIdDesc().stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional
    public ReviewResponse create(Long productId, Long memberId, ReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));
        Review review = reviewRepository.save(
                new Review(product, member, request.rating(), null, request.content().trim(), false));
        return ReviewResponse.from(review);
    }

    @Transactional
    public void delete(Long reviewId, AuthMember me) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> ApiException.notFound("리뷰를 찾을 수 없습니다."));
        if (me.role() != Role.ADMIN && !review.isWrittenBy(me.id())) {
            throw ApiException.forbidden("본인이 작성한 리뷰만 삭제할 수 있습니다.");
        }
        reviewRepository.delete(review);
    }
}
