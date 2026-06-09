package com.example.server.infrastructure.messaging.notification;

import java.time.Instant;

import com.example.server.core.notification.NotificationType;

public record NotificationDeliveryPayload(
        Long id,
        NotificationType type,
        Long actorId,
        String actorName,
        String actorPictureUrl,
        Long targetPostId,
        Long sourcePostId,
        Instant createdAt
) {
}
