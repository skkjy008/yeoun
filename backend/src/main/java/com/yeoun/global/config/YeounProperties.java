package com.yeoun.global.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "yeoun")
public record YeounProperties(Jwt jwt, Cors cors, Seed seed, Youtube youtube, Ai ai, Payment payment,
                              Commission commission, Storage storage, Redis redis) {

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

    /** 결제: 토스페이먼츠 키가 모두 있으면 실제 PG, 없으면 모의 결제 */
    public record Payment(Toss toss, int pendingExpireMinutes) {
        public record Toss(String clientKey, String secretKey, String apiBaseUrl) {
            public boolean enabled() {
                return clientKey != null && !clientKey.isBlank() && secretKey != null && !secretKey.isBlank();
            }
        }
    }

    /** 커미션 정산: 수수료율, 전달 후 자동 구매 확정까지의 일수, 제작 중 취소 시 환불 비율 */
    public record Commission(double feeRate, int autoConfirmDays, double inProgressRefundRate) {
    }

    /** 업로드 저장소: s3.bucket 이 있으면 S3(또는 MinIO), 없으면 로컬 디스크 */
    public record Storage(String localDir, String localPublicPath, long maxFileSize, S3 s3) {
        public record S3(String bucket, String region, String endpoint, String accessKey, String secretKey,
                         String publicBaseUrl, boolean pathStyle) {
            public boolean enabled() {
                return bucket != null && !bucket.isBlank();
            }
        }
    }

    /** 다중 인스턴스 실시간 알림: Redis Pub/Sub 사용 여부와 채널 이름 */
    public record Redis(boolean enabled, String channel) {
    }
}
