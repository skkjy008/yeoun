package com.yeoun.notification.dto;

import com.yeoun.notification.domain.Notification;
import java.time.LocalDateTime;

public record NotificationResponse(Long id, String type, String message, String link, boolean read,
                                   LocalDateTime createdAt) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType().name(), n.getMessage(), n.getLink(), n.isRead(),
                n.getCreatedAt());
    }
}
