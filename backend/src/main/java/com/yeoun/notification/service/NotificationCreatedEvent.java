package com.yeoun.notification.service;

import com.yeoun.notification.dto.NotificationResponse;

/** 알림이 저장되면 발행됩니다. 트랜잭션 커밋 후 SSE로 실시간 전송합니다. */
public record NotificationCreatedEvent(Long recipientId, NotificationResponse notification) {
}
