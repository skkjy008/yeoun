package com.yeoun.preference.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.yeoun.global.config.YeounProperties;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Claude API로 취향 큐레이션 문장을 생성합니다.
 * ANTHROPIC_API_KEY가 없거나 호출이 실패하면 빈 값을 돌려주고, 호출 측에서 규칙 기반 문장을 사용합니다.
 */
@Slf4j
@Component
public class AiCurationClient {

    private static final String SYSTEM_PROMPT = """
            당신은 향 큐레이션 브랜드 '여운(YEOUN)'의 조향 큐레이터입니다.
            고객이 고른 장면과 취향, 추천된 향 제품을 바탕으로 따뜻하고 감각적인 한국어 문장 2~3개를 씁니다.
            전문 용어를 남발하지 말고, 고객이 향을 상상할 수 있도록 구체적인 장면으로 묘사하세요.
            과장된 효능이나 의학적 표현은 쓰지 않습니다. 결과는 문장만 출력합니다.""";

    private final YeounProperties.Ai config;
    private final RestClient restClient;

    public AiCurationClient(YeounProperties properties) {
        this.config = properties.ai();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(12));
        this.restClient = RestClient.builder()
                .baseUrl("https://api.anthropic.com")
                .requestFactory(factory)
                .build();
    }

    public boolean isEnabled() {
        return config.enabled();
    }

    public Optional<String> curate(List<String> answers, List<String> keywords, List<String> productLines) {
        if (!config.enabled()) {
            return Optional.empty();
        }
        String userMessage = """
                [고객이 고른 장면]
                %s

                [취향 키워드]
                %s

                [추천 제품]
                %s
                """.formatted(String.join("\n", answers), String.join(", ", keywords),
                String.join("\n", productLines));
        try {
            JsonNode response = restClient.post()
                    .uri("/v1/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-api-key", config.anthropicApiKey())
                    .header("anthropic-version", "2023-06-01")
                    .body(Map.of(
                            "model", config.model(),
                            "max_tokens", 400,
                            "system", SYSTEM_PROMPT,
                            "messages", List.of(Map.of("role", "user", "content", userMessage))))
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null) {
                return Optional.empty();
            }
            JsonNode text = response.path("content").path(0).path("text");
            return text.isMissingNode() || text.asText().isBlank() ? Optional.empty() : Optional.of(text.asText().trim());
        } catch (Exception e) {
            log.warn("Claude 큐레이션 호출 실패 - 규칙 기반 문장으로 대체합니다: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
