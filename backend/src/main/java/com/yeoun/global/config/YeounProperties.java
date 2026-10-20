package com.yeoun.global.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "yeoun")
public record YeounProperties(Jwt jwt, Cors cors, Seed seed, Youtube youtube, Ai ai) {

    public record Jwt(String secret, long accessTokenValiditySeconds) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Seed(boolean enabled, String adminEmail, String adminPassword) {
    }

    public record Youtube(String apiKey) {
        public boolean enabled() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    public record Ai(String anthropicApiKey, String model) {
        public boolean enabled() {
            return anthropicApiKey != null && !anthropicApiKey.isBlank();
        }
    }
}
