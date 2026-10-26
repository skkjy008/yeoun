package com.yeoun.notification.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 실시간 알림(Server-Sent Events). 커미션 의뢰가 등록되면 접속 중인 조향사에게 바로 전달됩니다.
 * 서버가 여러 대일 때는 RedisNotificationBroadcaster가 Pub/Sub으로 모든 서버에 이벤트를 나눠 줍니다.
 */
@Slf4j
@Component
public class NotificationStreamService {

    private static final long TIMEOUT_MILLIS = 30 * 60 * 1000L;

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long memberId, long unreadCount) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MILLIS);
        emitters.computeIfAbsent(memberId, id -> new CopyOnWriteArrayList<>()).add(emitter);
        Runnable remove = () -> remove(memberId, emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(e -> remove.run());
        send(memberId, emitter, SseEmitter.event().name("connected").data(Map.of("unreadCount", unreadCount)));
        return emitter;
    }

    /** 이 서버에 연결된 구독자에게만 전송합니다. (서버 간 전달은 NotificationBroadcaster가 담당) */
    public void deliverLocal(NotificationCreatedEvent event) {
        List<SseEmitter> targets = emitters.get(event.recipientId());
        if (targets == null) {
            return;
        }
        targets.forEach(emitter -> send(event.recipientId(), emitter,
                SseEmitter.event().name("notification").data(event.notification())));
    }

    /** 프록시가 유휴 연결을 끊지 않도록 주기적으로 주석 이벤트를 보냅니다. */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        emitters.forEach((memberId, list) -> list.forEach(emitter ->
                send(memberId, emitter, SseEmitter.event().comment("ping"))));
    }

    public int connectionCount() {
        return emitters.values().stream().mapToInt(List::size).sum();
    }

    private void send(Long memberId, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException e) {
            log.debug("SSE 전송 실패 member={} : {}", memberId, e.getMessage());
            remove(memberId, emitter);
        }
    }

    private void remove(Long memberId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(memberId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitters.remove(memberId, list);
            }
        }
    }
}
