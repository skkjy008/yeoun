package com.yeoun.music;

import com.fasterxml.jackson.databind.JsonNode;
import com.yeoun.global.config.YeounProperties;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * 상세 페이지 음악 추천을 YouTube 영상과 연동합니다.
 * YOUTUBE_API_KEY가 설정되어 있으면 Data API v3 검색으로 영상 ID를 찾아 임베드하고,
 * 없으면 YouTube 검색 링크만 제공합니다. 같은 검색어는 메모리에 캐시해 할당량을 아낍니다.
 */
@Slf4j
@Service
public class YoutubeService {

    public record VideoResult(String query, String videoId, String embedUrl, String searchUrl) {
    }

    private final YeounProperties.Youtube config;
    private final RestClient restClient;
    private final Map<String, Optional<String>> cache = new ConcurrentHashMap<>();

    public YoutubeService(YeounProperties properties) {
        this.config = properties.youtube();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder().baseUrl("https://www.googleapis.com/youtube/v3")
                .requestFactory(factory).build();
    }

    public VideoResult find(String query) {
        String normalized = query.trim();
        String searchUrl = "https://www.youtube.com/results?search_query="
                + URLEncoder.encode(normalized, StandardCharsets.UTF_8);
        Optional<String> videoId = config.enabled()
                ? cache.computeIfAbsent(normalized.toLowerCase(), key -> search(normalized))
                : Optional.empty();
        return new VideoResult(normalized, videoId.orElse(null),
                videoId.map(id -> "https://www.youtube-nocookie.com/embed/" + id).orElse(null), searchUrl);
    }

    private Optional<String> search(String query) {
        try {
            JsonNode body = restClient.get()
                    .uri(uri -> uri.path("/search")
                            .queryParam("part", "snippet")
                            .queryParam("type", "video")
                            .queryParam("videoEmbeddable", "true")
                            .queryParam("maxResults", 1)
                            .queryParam("q", query)
                            .queryParam("key", config.apiKey())
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null) {
                return Optional.empty();
            }
            JsonNode id = body.path("items").path(0).path("id").path("videoId");
            return id.isMissingNode() ? Optional.empty() : Optional.of(id.asText());
        } catch (Exception e) {
            log.warn("YouTube 검색 실패: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
