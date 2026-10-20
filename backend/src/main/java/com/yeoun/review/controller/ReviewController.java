package com.yeoun.review.controller;

import com.yeoun.global.common.PageResponse;
import com.yeoun.global.security.AuthMember;
import com.yeoun.review.dto.ReviewDtos.ReviewRequest;
import com.yeoun.review.dto.ReviewDtos.ReviewResponse;
import com.yeoun.review.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/products/{productId}/reviews")
    public PageResponse<ReviewResponse> list(@PathVariable Long productId,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "10") int size) {
        return reviewService.findByProduct(productId, page, Math.min(size, 50));
    }

    @GetMapping("/api/reviews/featured")
    public List<ReviewResponse> featured() {
        return reviewService.featured();
    }

    @PostMapping("/api/products/{productId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@PathVariable Long productId, @AuthenticationPrincipal AuthMember me,
                                 @Valid @RequestBody ReviewRequest request) {
        return reviewService.create(productId, me.id(), request);
    }

    @DeleteMapping("/api/reviews/{reviewId}")
    public ResponseEntity<Void> delete(@PathVariable Long reviewId, @AuthenticationPrincipal AuthMember me) {
        reviewService.delete(reviewId, me);
        return ResponseEntity.noContent().build();
    }
}
