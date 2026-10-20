package com.yeoun.preference.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.yeoun.preference.domain.PreferenceOption;
import com.yeoun.product.domain.Product;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ScentProfileTest {

    private static Product product(String incCd, int intensity, String... tags) {
        return new Product(new Product.Spec(incCd, "테스트", "부제", null, "디퓨저", "200ml", 1000, 1, "/img.jpg",
                null, null, null, null, null, null, null, null, null, null, null, null, intensity, 0, false,
                List.of(), List.of(), List.of(), List.of(), Set.of(tags)));
    }

    @Test
    void 선택한_향계열과_사용장면_무게감이_맞을수록_점수가_높다() {
        ScentProfile profile = ScentProfile.of(List.of(
                new PreferenceOption(1, "숲", null, "WOODY,GREEN", null, null),
                new PreferenceOption(1, "도서관", null, "WOODY,AMBER", null, null),
                new PreferenceOption(1, "외출", null, null, "003", null),
                new PreferenceOption(1, "묵직", null, null, null, 3)));

        Product woodyPerfume = product("003", 3, "WOODY", "AMBER");
        Product citrusCandle = product("004", 1, "CITRUS", "SWEET");

        assertThat(profile.score(woodyPerfume)).isGreaterThan(profile.score(citrusCandle));
        assertThat(profile.topKeywords(1)).containsExactly("우디");
        assertThat(profile.intensityLabel()).isEqualTo("묵직하고 깊은");
    }

    @Test
    void 빈_선택이면_빈_프로필이다() {
        assertThat(ScentProfile.of(List.of()).isEmpty()).isTrue();
    }
}
