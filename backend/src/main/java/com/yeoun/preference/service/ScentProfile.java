package com.yeoun.preference.service;

import com.yeoun.preference.domain.PreferenceOption;
import com.yeoun.product.domain.Product;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 회원이 고른 선택지들을 모은 취향 프로필.
 * 향 계열 태그 가중치 + 선호 향 종류 + 선호 무게감으로 상품과의 연관도를 계산합니다.
 */
public record ScentProfile(Map<String, Integer> tagWeights, Set<String> preferredCategories, Integer intensity) {

    public static final Map<String, String> TAG_LABELS = Map.ofEntries(
            Map.entry("WOODY", "우디"), Map.entry("GREEN", "그린"), Map.entry("CITRUS", "시트러스"),
            Map.entry("MUSK", "머스크"), Map.entry("FLORAL", "플로럴"), Map.entry("TEA", "티"),
            Map.entry("AMBER", "앰버"), Map.entry("AQUATIC", "아쿠아틱"), Map.entry("EARTHY", "어시"),
            Map.entry("POWDERY", "파우더리"), Map.entry("SWEET", "스위트"), Map.entry("HERBAL", "허벌"),
            Map.entry("SMOKY", "스모키"));

    public static ScentProfile of(Collection<PreferenceOption> options) {
        Map<String, Integer> weights = new LinkedHashMap<>();
        Set<String> categories = new LinkedHashSet<>();
        Integer intensity = null;
        for (PreferenceOption option : options) {
            option.tagList().forEach(tag -> weights.merge(tag.toUpperCase(), 1, Integer::sum));
            categories.addAll(option.categoryHints());
            if (option.getIntensity() != null) {
                intensity = option.getIntensity();
            }
        }
        return new ScentProfile(weights, categories, intensity);
    }

    public boolean isEmpty() {
        return tagWeights.isEmpty() && preferredCategories.isEmpty() && intensity == null;
    }

    public int score(Product product) {
        int score = 0;
        for (String tag : product.getTags()) {
            score += tagWeights.getOrDefault(tag, 0) * 3;
        }
        if (preferredCategories.contains(product.getIncCd())) {
            score += 6;
        }
        if (intensity != null) {
            score += (2 - Math.abs(intensity - product.getIntensity())) * 2;
        }
        return score;
    }

    /** 가중치가 높은 향 계열 상위 n개 (한글 라벨) */
    public List<String> topKeywords(int n) {
        return tagWeights.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(n)
                .map(e -> TAG_LABELS.getOrDefault(e.getKey(), e.getKey()))
                .toList();
    }

    public String intensityLabel() {
        if (intensity == null) {
            return "은은한";
        }
        return switch (intensity) {
            case 1 -> "가볍고 은은한";
            case 3 -> "묵직하고 깊은";
            default -> "기분 좋게 감도는";
        };
    }
}
