package com.yeoun.product.dto;

import com.yeoun.product.domain.Category;
import com.yeoun.product.domain.Product;
import com.yeoun.product.domain.ScentNote;
import com.yeoun.product.domain.Track;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Set;

public final class ProductDtos {

    private ProductDtos() {
    }

    public record CategoryResponse(String code, String slug, String label, String tagline) {
        public static CategoryResponse from(Category c) {
            return new CategoryResponse(c.getCode(), c.getSlug(), c.getLabel(), c.getTagline());
        }
    }

    public record ProductSummary(Long id, String incCd, String category, String categorySlug, String name,
                                 String subtitle, String typeLabel, String volume, int price, boolean soldOut,
                                 boolean newArrival, String imageUrl, String thumbnailUrl) {

        public static ProductSummary from(Product p) {
            Category c = p.getCategory();
            return new ProductSummary(p.getId(), p.getIncCd(), c.getLabel(), c.getSlug(), p.getName(),
                    p.getSubtitle(), p.getTypeLabel(), p.getVolume(), p.getPrice(), p.isSoldOut(),
                    p.isNewArrival(), p.getImageUrl(),
                    p.getThumbnailUrl() == null ? p.getImageUrl() : p.getThumbnailUrl());
        }
    }

    public record NoteDto(@NotBlank @Size(max = 40) String name, @Size(max = 200) String description) {
        public static NoteDto from(ScentNote n) {
            return new NoteDto(n.getName(), n.getDescription());
        }

        public ScentNote toEntity() {
            return new ScentNote(name, description);
        }
    }

    public record TrackDto(@NotBlank @Size(max = 120) String title, @Size(max = 120) String artist,
                           @Size(max = 20) String youtubeVideoId) {
        public static TrackDto from(Track t) {
            return new TrackDto(t.getTitle(), t.getArtist(), t.getYoutubeVideoId());
        }

        public Track toEntity() {
            return new Track(title, artist, youtubeVideoId);
        }
    }

    public record ProductDetail(Long id, String incCd, String category, String categorySlug, String name,
                                String subtitle, String englishLine, String typeLabel, String volume, int price,
                                int stock, boolean soldOut, boolean newArrival, String imageUrl, String thumbnailUrl,
                                String artworkUrl, String artworkCaption, String scentFamily, String feeling,
                                String scene, String bestPlace, String composition, String storyTitle,
                                String storyBody, String safetyNotice, String playlistTitle, int intensity,
                                int popularity, List<NoteDto> notes, List<String> ritualSteps,
                                List<String> poemLines, List<TrackDto> tracks, Set<String> tags,
                                double averageRating, long reviewCount) {

        public static ProductDetail from(Product p, double averageRating, long reviewCount) {
            Category c = p.getCategory();
            return new ProductDetail(p.getId(), p.getIncCd(), c.getLabel(), c.getSlug(), p.getName(),
                    p.getSubtitle(), p.getEnglishLine(), p.getTypeLabel(), p.getVolume(), p.getPrice(),
                    p.getStock(), p.isSoldOut(), p.isNewArrival(), p.getImageUrl(), p.getThumbnailUrl(),
                    p.getArtworkUrl(), p.getArtworkCaption(), p.getScentFamily(), p.getFeeling(), p.getScene(),
                    p.getBestPlace(), p.getComposition(), p.getStoryTitle(), p.getStoryBody(),
                    p.getSafetyNotice(), p.getPlaylistTitle(), p.getIntensity(), p.getPopularity(),
                    p.getNotes().stream().map(NoteDto::from).toList(),
                    List.copyOf(p.getRitualSteps()),
                    List.copyOf(p.getPoemLines()),
                    p.getTracks().stream().map(TrackDto::from).toList(),
                    Set.copyOf(p.getTags()),
                    averageRating, reviewCount);
        }
    }

    /** 관리자 상품 생성/수정 요청 */
    public record ProductRequest(
            @NotBlank @Pattern(regexp = "00[1-4]", message = "향 종류 코드는 001~004 중 하나여야 합니다.") String incCd,
            @NotBlank @Size(max = 60) String name,
            @NotBlank @Size(max = 120) String subtitle,
            @Size(max = 80) String englishLine,
            @NotBlank @Size(max = 20) String typeLabel,
            @NotBlank @Size(max = 20) String volume,
            @Min(0) int price,
            @Min(0) int stock,
            @NotBlank @Size(max = 200) String imageUrl,
            @Size(max = 200) String thumbnailUrl,
            @Size(max = 200) String artworkUrl,
            @Size(max = 80) String artworkCaption,
            @Size(max = 60) String scentFamily,
            @Size(max = 20) String feeling,
            @Size(max = 30) String scene,
            @Size(max = 100) String bestPlace,
            @Size(max = 100) String composition,
            @Size(max = 100) String storyTitle,
            @Size(max = 600) String storyBody,
            @Size(max = 600) String safetyNotice,
            @Size(max = 60) String playlistTitle,
            @Min(1) @Max(3) int intensity,
            @Min(0) int popularity,
            boolean newArrival,
            @Valid List<NoteDto> notes,
            List<@Size(max = 200) String> ritualSteps,
            List<@Size(max = 120) String> poemLines,
            @Valid List<TrackDto> tracks,
            Set<@Size(max = 20) String> tags) {

        public Product.Spec toSpec() {
            return new Product.Spec(incCd, name, subtitle, englishLine, typeLabel, volume, price, stock, imageUrl,
                    thumbnailUrl, artworkUrl, artworkCaption, scentFamily, feeling, scene, bestPlace, composition,
                    storyTitle, storyBody, safetyNotice, playlistTitle, intensity, popularity, newArrival,
                    notes == null ? List.of() : notes.stream().map(NoteDto::toEntity).toList(),
                    ritualSteps, poemLines,
                    tracks == null ? List.of() : tracks.stream().map(TrackDto::toEntity).toList(),
                    tags);
        }
    }

    public record FilterOptions(List<String> feelings, List<String> scenes) {
    }

    public record StockRequest(@Min(0) int stock) {
    }
}
