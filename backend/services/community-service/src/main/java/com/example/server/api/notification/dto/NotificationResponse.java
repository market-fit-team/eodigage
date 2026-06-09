package com.example.server.api.notification.dto;

import java.time.Instant;

import com.example.server.core.notification.Notification;
import com.example.server.core.notification.NotificationType;

public record NotificationResponse(
        Long id,
        NotificationType type,
        Long actorId,
        String actorName,
        String actorPictureUrl,
        Long targetPostId,
        Long sourcePostId,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getActor().getId(),
                notification.getActor().getName(),
                notification.getActor().getPictureUrl(),
                notification.getTargetPost().getId(),
                notification.getSourcePost() == null ? null : notification.getSourcePost().getId(),
                !notification.isUnread(),
                notification.getCreatedAt()
        );
    }
}
