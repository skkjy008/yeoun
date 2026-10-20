package com.yeoun.preference.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.Arrays;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 질문별 선택지. 선택 시 향 계열 태그 / 선호 카테고리 / 향의 무게감 정보를 남깁니다. */
@Getter
@Entity
@Table(name = "preference_option",
        uniqueConstraints = @UniqueConstraint(name = "uk_option_no", columnNames = {"question_id", "option_no"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PreferenceOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private PreferenceQuestion question;

    @Column(name = "option_no", nullable = false)
    private int optionNo;

    @Column(nullable = false, length = 120)
    private String label;

    @Column(name = "image_url", length = 200)
    private String imageUrl;

    /** 쉼표로 구분된 향 계열 태그. 예) WOODY,AMBER */
    @Column(length = 120)
    private String tags;

    /** 사용 장면 질문에서 선호하는 향 종류 코드들 (쉼표 구분) */
    @Column(name = "category_hint", length = 20)
    private String categoryHint;

    /** 잔향 질문에서 선택한 무게감(1~3) */
    @Column
    private Integer intensity;

    public PreferenceOption(int optionNo, String label, String imageUrl, String tags, String categoryHint,
                            Integer intensity) {
        this.optionNo = optionNo;
        this.label = label;
        this.imageUrl = imageUrl;
        this.tags = tags;
        this.categoryHint = categoryHint;
        this.intensity = intensity;
    }

    void assignTo(PreferenceQuestion question) {
        this.question = question;
    }

    public List<String> tagList() {
        return split(tags);
    }

    public List<String> categoryHints() {
        return split(categoryHint);
    }

    private static List<String> split(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
