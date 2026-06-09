package com.example.server.core.notification.event;

import java.time.Instant;

import com.example.server.core.notification.Notification;
import com.example.server.core.notification.NotificationType;

public record NotificationCreatedEvent(
        Long notificationId,
        Long recipientUserId,
        NotificationType type,
        Long actorId,
        String actorName,
        String actorPictureUrl,
        Long targetPostId,
        Long sourcePostId,
        Instant createdAt
) {
    public static NotificationCreatedEvent from(Notification notification) {
        return new NotificationCreatedEvent(
                notification.getId(),
                notification.getRecipient().getId(),
                notification.getType(),
                notification.getActor().getId(),
                notification.getActor().getName(),
                notification.getActor().getPictureUrl(),
                notification.getTargetPost().getId(),
                notification.getSourcePost() == null ? null : notification.getSourcePost().getId(),
                notification.getCreatedAt()
        );
    }
}
