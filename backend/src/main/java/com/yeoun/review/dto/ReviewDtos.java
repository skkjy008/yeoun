package com.yeoun.review.dto;

import com.yeoun.review.domain.Review;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class ReviewDtos {

    private ReviewDtos() {
    }

    public record ReviewRequest(
            @Min(value = 1, message = "별점은 1~5점입니다.") @Max(value = 5, message = "별점은 1~5점입니다.") int rating,
            @NotBlank(message = "내용을 입력해 주세요.") @Size(max = 500, message = "최대 500자까지 남길 수 있어요.") String content) {
    }

    public record ReviewResponse(Long id, Long productId, String productName, String authorName, Long authorId,
                                 int rating, String headline, String content, LocalDateTime createdAt) {

        public static ReviewResponse from(Review r) {
            return new ReviewResponse(r.getId(), r.getProduct().getId(), r.getProduct().getName(),
                    maskName(r.getMember().getName()), r.getMember().getId(), r.getRating(), r.getHeadline(),
                    r.getContent(), r.getCreatedAt());
        }

        /** 김여연 → 김*연 */
        static String maskName(String name) {
            if (name == null || name.length() < 2) {
                return name;
            }
            if (name.length() == 2) {
                return name.charAt(0) + "*";
            }
            return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
        }
    }
}
