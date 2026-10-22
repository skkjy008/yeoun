package com.yeoun.notification.controller;

import com.yeoun.global.security.AuthMember;
import com.yeoun.notification.dto.NotificationResponse;
import com.yeoun.notification.service.NotificationService;
import java.util.List;
import java.util.Map;
import com.yeoun.notification.service.NotificationStreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStreamService streamService;

    /** 실시간 알림 구독. 브라우저는 fetch 스트림으로 Authorization 헤더를 실어 연결합니다. */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal AuthMember me) {
        return streamService.subscribe(me.id(), notificationService.countUnread(me.id()));
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal AuthMember me) {
        return notificationService.findMine(me.id());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal AuthMember me) {
        return Map.of("count", notificationService.countUnread(me.id()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> read(@AuthenticationPrincipal AuthMember me, @PathVariable Long id) {
        notificationService.markRead(me.id(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> readAll(@AuthenticationPrincipal AuthMember me) {
        notificationService.markAllRead(me.id());
        return ResponseEntity.noContent().build();
    }
}
