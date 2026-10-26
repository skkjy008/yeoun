package com.yeoun.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yeoun.global.config.YeounProperties;
import java.nio.charset.StandardCharsets;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * 다중 서버용 실시간 알림. 알림이 생기면 Redis 채널에 발행하고,
 * 모든 서버가 구독하다가 자기에게 연결된 사용자에게 SSE로 전달합니다.
 * (사용자의 SSE 연결이 어느 서버에 붙어 있든 알림이 도착)
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "yeoun.redis.enabled", havingValue = "true")
public class RedisNotificationBroadcaster implements NotificationBroadcaster {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationStreamService streamService;
    private final String channel;

    public RedisNotificationBroadcaster(StringRedisTemplate redisTemplate, ObjectMapper objectMapper,
                                        NotificationStreamService streamService, YeounProperties properties) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.streamService = streamService;
        this.channel = properties.redis().channel();
    }

    @Override
    public void broadcast(NotificationCreatedEvent event) {
        try {
            redisTemplate.convertAndSend(channel, objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException e) {
            log.warn("[notification] 직렬화 실패", e);
        } catch (RuntimeException e) {
            // Redis가 잠시 내려가도 알림 자체는 DB에 저장되어 있으므로 이 서버의 구독자에게라도 보냅니다.
            log.warn("[notification] Redis 발행 실패 → 로컬 전송으로 대체: {}", e.getMessage());
            streamService.deliverLocal(event);
        }
    }

    @Bean
    public RedisMessageListenerContainer notificationListenerContainer(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener((message, pattern) -> {
            try {
                NotificationCreatedEvent event = objectMapper.readValue(
                        new String(message.getBody(), StandardCharsets.UTF_8), NotificationCreatedEvent.class);
                streamService.deliverLocal(event);
            } catch (Exception e) {
                log.warn("[notification] Redis 메시지 처리 실패", e);
            }
        }, new ChannelTopic(channel));
        log.info("[notification] Redis 채널 '{}'을 구독합니다.", channel);
        return container;
    }
}
