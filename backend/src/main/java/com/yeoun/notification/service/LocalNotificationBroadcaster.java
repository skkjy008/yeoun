package com.yeoun.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Redis를 쓰지 않을 때(단일 서버): 이 서버의 구독자에게 바로 전송 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "yeoun.redis.enabled", havingValue = "false", matchIfMissing = true)
public class LocalNotificationBroadcaster implements NotificationBroadcaster {

    private final NotificationStreamService streamService;

    @Override
    public void broadcast(NotificationCreatedEvent event) {
        streamService.deliverLocal(event);
    }
}
