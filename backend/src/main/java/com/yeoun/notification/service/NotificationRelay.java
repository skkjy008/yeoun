package com.yeoun.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/** 알림 저장 트랜잭션이 커밋된 뒤에만 실시간 전송합니다. (롤백된 알림이 나가지 않도록) */
@Component
@RequiredArgsConstructor
public class NotificationRelay {

    private final NotificationBroadcaster broadcaster;

    @TransactionalEventListener(fallbackExecution = true)
    public void onCreated(NotificationCreatedEvent event) {
        broadcaster.broadcast(event);
    }
}
