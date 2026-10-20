package com.yeoun.product.domain;

import com.yeoun.global.exception.ApiException;
import java.util.Arrays;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 향 종류 코드(inc_cd). 001~004 순서대로 방향제, 인센스, 향수, 캔들.
 */
@Getter
@RequiredArgsConstructor
public enum Category {
    DIFFUSER("001", "diffuser", "방향제", "FOR THE HOME"),
    INCENSE("002", "incense", "인센스", "FOR THE MOMENT"),
    PERFUME("003", "perfume", "향수", "FOR YOURSELF"),
    CANDLE("004", "candle", "캔들", "FOR THE EVENING");

    private final String code;
    private final String slug;
    private final String label;
    private final String tagline;

    public static Category fromCode(String code) {
        return Arrays.stream(values()).filter(c -> c.code.equals(code)).findFirst()
                .orElseThrow(() -> ApiException.badRequest("알 수 없는 향 종류 코드입니다: " + code));
    }

    public static Category fromSlug(String slug) {
        return Arrays.stream(values()).filter(c -> c.slug.equalsIgnoreCase(slug) || c.code.equals(slug)).findFirst()
                .orElseThrow(() -> ApiException.notFound("카테고리를 찾을 수 없습니다: " + slug));
    }
}
