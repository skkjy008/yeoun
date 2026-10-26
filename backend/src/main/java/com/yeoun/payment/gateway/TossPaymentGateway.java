package com.yeoun.payment.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * 토스페이먼츠 결제 승인·취소 (https://docs.tosspayments.com)
 * 시크릿 키는 서버에만 두고, Basic 인증(시크릿키 + ':' 를 Base64)으로 호출합니다.
 */
@Slf4j
public class TossPaymentGateway implements PaymentGateway {

    public static final String PROVIDER = "TOSS";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final RestClient client;

    public TossPaymentGateway(String secretKey, String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(30));
        String basic = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String provider() {
        return PROVIDER;
    }

    @Override
    public Approval confirm(String paymentKey, String orderKey, int amount) {
        JsonNode body = call(() -> client.post().uri("/v1/payments/confirm")
                .body(Map.of("paymentKey", paymentKey, "orderId", orderKey, "amount", amount))
                .retrieve()
                .body(JsonNode.class));
        String method = text(body, "method");
        JsonNode easyPay = body.path("easyPay");
        if (!easyPay.isMissingNode() && !easyPay.isNull() && easyPay.hasNonNull("provider")) {
            method = method + " · " + easyPay.get("provider").asText();
        }
        String approvedAt = text(body, "approvedAt");
        return new Approval(text(body, "paymentKey"), method, body.path("receipt").path("url").asText(null),
                approvedAt == null ? LocalDateTime.now() : OffsetDateTime.parse(approvedAt).toLocalDateTime(),
                body.path("totalAmount").asInt(amount));
    }

    @Override
    public void cancel(String paymentKey, String reason, Integer cancelAmount) {
        Map<String, Object> request = new HashMap<>();
        request.put("cancelReason", reason);
        if (cancelAmount != null) {
            request.put("cancelAmount", cancelAmount);
        }
        call(() -> client.post().uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                .header("Idempotency-Key", paymentKey + "-" + reason.hashCode() + "-" + cancelAmount)
                .body(request)
                .retrieve()
                .body(JsonNode.class));
    }

    private JsonNode call(java.util.function.Supplier<JsonNode> request) {
        try {
            return request.get();
        } catch (RestClientResponseException e) {
            JsonNode error = parse(e.getResponseBodyAsString());
            String code = error == null ? "PG_ERROR" : error.path("code").asText("PG_ERROR");
            String message = error == null ? "결제사 응답을 처리하지 못했습니다." : error.path("message").asText();
            log.warn("[toss] {} {}", code, message);
            throw new PaymentGatewayException(code, message);
        } catch (RuntimeException e) {
            log.warn("[toss] 통신 실패: {}", e.getMessage());
            throw new PaymentGatewayException("PG_UNAVAILABLE", "결제사와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    private static JsonNode parse(String body) {
        try {
            return body == null || body.isBlank() ? null : MAPPER.readTree(body);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
