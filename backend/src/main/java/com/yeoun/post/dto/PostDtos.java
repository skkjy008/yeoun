package com.yeoun.post.dto;

import com.yeoun.post.domain.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class PostDtos {

    private PostDtos() {
    }

    public record PostRequest(@NotNull Post.Type type, @Size(max = 60) String eyebrow,
                              @NotBlank @Size(max = 120) String title, @Size(max = 1000) String body,
                              @Size(max = 40) String ctaLabel, @Size(max = 200) String ctaLink,
                              @Size(max = 200) String imageUrl, @Size(max = 80) String caption,
                              @Size(max = 120) String footnote, int sortOrder, boolean published) {
        public Post.Spec toSpec() {
            return new Post.Spec(type, eyebrow, title, body, ctaLabel, ctaLink, imageUrl, caption, footnote,
                    sortOrder, published);
        }
    }

    public record PostResponse(Long id, String type, String eyebrow, String title, String body, String ctaLabel,
                               String ctaLink, String imageUrl, String caption, String footnote, int sortOrder,
                               boolean published, LocalDateTime createdAt) {
        public static PostResponse from(Post p) {
            return new PostResponse(p.getId(), p.getType().name(), p.getEyebrow(), p.getTitle(), p.getBody(),
                    p.getCtaLabel(), p.getCtaLink(), p.getImageUrl(), p.getCaption(), p.getFootnote(),
                    p.getSortOrder(), p.isPublished(), p.getCreatedAt());
        }
    }
}
