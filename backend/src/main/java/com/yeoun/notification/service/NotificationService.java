package com.yeoun.notification.service;

import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.Role;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.notification.domain.Notification;
import com.yeoun.notification.domain.Notification.Type;
import com.yeoun.notification.dto.NotificationResponse;
import com.yeoun.notification.repository.NotificationRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;
    private final ApplicationEventPublisher eventPublisher;

    /** 특정 권한을 가진 모든 회원에게 알림을 보냅니다. (예: 조향사 인증 요청 → 모든 운영자) */
    @Transactional
    public void notifyRole(Role role, Type type, String message, String link) {
        List<Notification> notifications = memberRepository.findAllByRole(role).stream()
                .map(recipient -> new Notification(recipient, type, message, link))
                .toList();
        notificationRepository.saveAll(notifications).forEach(this::publish);
    }

    @Transactional
    public void notify(Member recipient, Type type, String message, String link) {
        publish(notificationRepository.save(new Notification(recipient, type, message, link)));
    }

    private void publish(Notification notification) {
        eventPublisher.publishEvent(new NotificationCreatedEvent(notification.getRecipient().getId(),
                NotificationResponse.from(notification)));
    }

    public List<NotificationResponse> findMine(Long memberId) {
        return notificationRepository.findTop30ByRecipientIdOrderByCreatedAtDesc(memberId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    public long countUnread(Long memberId) {
        return notificationRepository.countByRecipientIdAndReadFalse(memberId);
    }

    @Transactional
    public void markRead(Long memberId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("알림을 찾을 수 없습니다."));
        if (!notification.getRecipient().getId().equals(memberId)) {
            throw ApiException.forbidden("본인의 알림만 읽음 처리할 수 있습니다.");
        }
        notification.markRead();
    }

    @Transactional
    public void markAllRead(Long memberId) {
        notificationRepository.findAllByRecipientIdAndReadFalse(memberId).forEach(Notification::markRead);
    }
}
