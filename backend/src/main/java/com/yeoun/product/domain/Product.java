package com.yeoun.product.domain;

import com.yeoun.global.exception.ApiException;
import com.yeoun.global.common.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "product", indexes = {
        @Index(name = "idx_product_inc_cd", columnList = "inc_cd"),
        @Index(name = "idx_product_active", columnList = "active")})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 향 종류 코드. 001 방향제 / 002 인센스 / 003 향수 / 004 캔들 */
    @Column(name = "inc_cd", nullable = false, length = 3)
    private String incCd;

    @Column(nullable = false, length = 60)
    private String name;

    /** 한 줄 장면 설명. 예) 비 내린 숲 속을 걸어가는 느낌 */
    @Column(nullable = false, length = 120)
    private String subtitle;

    /** 영문 컬렉션 라인. 예) AFTER THE RAIN — YEOUN */
    @Column(name = "english_line", length = 80)
    private String englishLine;

    @Column(name = "type_label", nullable = false, length = 20)
    private String typeLabel;

    @Column(nullable = false, length = 20)
    private String volume;

    @Column(nullable = false)
    private int price;

    /** 재고 수량. 0이면 상세 페이지에 Sold Out 표시 */
    @Column(nullable = false)
    private int stock;

    @Column(name = "image_url", nullable = false, length = 200)
    private String imageUrl;

    /** 메인 페이지 카드용 스튜디오 컷(없으면 imageUrl 사용) */
    @Column(name = "thumbnail_url", length = 200)
    private String thumbnailUrl;

    @Column(name = "artwork_url", length = 200)
    private String artworkUrl;

    @Column(name = "artwork_caption", length = 80)
    private String artworkCaption;

    @Column(name = "scent_family", length = 60)
    private String scentFamily;

    /** 필터용 향의 느낌 (예: 우디, 플로럴) */
    @Column(length = 20)
    private String feeling;

    /** 필터용 놓을 공간/함께할 순간 */
    @Column(length = 30)
    private String scene;

    @Column(name = "best_place", length = 100)
    private String bestPlace;

    @Column(length = 100)
    private String composition;

    @Column(name = "story_title", length = 100)
    private String storyTitle;

    @Column(name = "story_body", length = 600)
    private String storyBody;

    @Column(name = "safety_notice", length = 600)
    private String safetyNotice;

    @Column(name = "playlist_title", length = 60)
    private String playlistTitle;

    /** 1: 가볍게 / 2: 은은한 잔향 / 3: 묵직하게 */
    @Column(nullable = false)
    private int intensity;

    @Column(nullable = false)
    private int popularity;

    @Column(name = "is_new", nullable = false)
    private boolean newArrival;

    @Column(nullable = false)
    private boolean active = true;

    @ElementCollection
    @CollectionTable(name = "product_note", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "sort_order")
    private List<ScentNote> notes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "product_ritual_step", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "step", length = 200)
    private List<String> ritualSteps = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "product_poem_line", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "line", length = 120)
    private List<String> poemLines = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "product_track", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "sort_order")
    private List<Track> tracks = new ArrayList<>();

    /** 취향 매칭용 향 계열 태그 (WOODY, GREEN, CITRUS ...) */
    @ElementCollection
    @CollectionTable(name = "product_tag", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tag", length = 20)
    private Set<String> tags = new LinkedHashSet<>();

    public Product(Spec spec) {
        apply(spec);
    }

    public void apply(Spec spec) {
        this.incCd = Category.fromCode(spec.incCd()).getCode();
        this.name = spec.name();
        this.subtitle = spec.subtitle();
        this.englishLine = spec.englishLine();
        this.typeLabel = spec.typeLabel();
        this.volume = spec.volume();
        this.price = spec.price();
        this.stock = Math.max(0, spec.stock());
        this.imageUrl = spec.imageUrl();
        this.thumbnailUrl = spec.thumbnailUrl();
        this.artworkUrl = spec.artworkUrl();
        this.artworkCaption = spec.artworkCaption();
        this.scentFamily = spec.scentFamily();
        this.feeling = spec.feeling();
        this.scene = spec.scene();
        this.bestPlace = spec.bestPlace();
        this.composition = spec.composition();
        this.storyTitle = spec.storyTitle();
        this.storyBody = spec.storyBody();
        this.safetyNotice = spec.safetyNotice();
        this.playlistTitle = spec.playlistTitle();
        this.intensity = Math.min(3, Math.max(1, spec.intensity()));
        this.popularity = spec.popularity();
        this.newArrival = spec.newArrival();
        replace(this.notes, spec.notes());
        replace(this.ritualSteps, spec.ritualSteps());
        replace(this.poemLines, spec.poemLines());
        replace(this.tracks, spec.tracks());
        this.tags.clear();
        if (spec.tags() != null) {
            spec.tags().forEach(tag -> this.tags.add(tag.toUpperCase()));
        }
    }

    private static <T> void replace(List<T> target, List<T> source) {
        target.clear();
        if (source != null) {
            target.addAll(source);
        }
    }

    @Transient
    public Category getCategory() {
        return Category.fromCode(incCd);
    }

    @Transient
    public boolean isSoldOut() {
        return stock <= 0;
    }

    public void deactivate() {
        this.active = false;
    }

    public void changeStock(int stock) {
        this.stock = Math.max(0, stock);
    }

    /** 주문 시 재고를 차감합니다. 재고가 부족하면 주문할 수 없습니다. */
    public void decreaseStock(int quantity) {
        if (!active) {
            throw ApiException.badRequest("판매가 종료된 상품입니다: " + name);
        }
        if (quantity > stock) {
            throw ApiException.conflict(stock == 0
                    ? "'%s'은(는) 품절되었어요.".formatted(name)
                    : "'%s'의 남은 재고는 %d개입니다.".formatted(name, stock));
        }
        this.stock -= quantity;
        this.popularity += quantity;
    }

    /** 주문 취소 시 재고를 되돌립니다. */
    public void increaseStock(int quantity) {
        this.stock += quantity;
        this.popularity = Math.max(0, this.popularity - quantity);
    }

    /** 생성·수정에 사용하는 상품 명세 */
    public record Spec(
            String incCd, String name, String subtitle, String englishLine, String typeLabel, String volume,
            int price, int stock, String imageUrl, String thumbnailUrl, String artworkUrl, String artworkCaption,
            String scentFamily, String feeling, String scene, String bestPlace, String composition,
            String storyTitle, String storyBody, String safetyNotice, String playlistTitle,
            int intensity, int popularity, boolean newArrival,
            List<ScentNote> notes, List<String> ritualSteps, List<String> poemLines, List<Track> tracks,
            Set<String> tags) {
    }
}
