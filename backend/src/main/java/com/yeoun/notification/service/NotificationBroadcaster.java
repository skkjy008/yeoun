package com.yeoun.notification.service;

/** 저장된 알림을 실시간 구독자에게 퍼뜨립니다. (단일 서버: 바로 전송 / 다중 서버: Redis Pub/Sub) */
public interface NotificationBroadcaster {

    void broadcast(NotificationCreatedEvent event);
}
