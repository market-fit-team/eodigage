package com.marketfit.post.api.notification.dto;

import java.time.Instant;
import java.util.UUID;

import com.marketfit.post.core.notification.Notification;
import com.marketfit.post.core.notification.NotificationType;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        UUID targetPostId,
        UUID targetCommentId,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getTargetPostId(),
                notification.getTargetCommentId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
