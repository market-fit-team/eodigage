package com.example.server.infrastructure.messaging.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationDeliveryMessage(
        UUID eventId,
        String eventType,
        Long recipientUserId,
        NotificationDeliveryPayload payload,
        Instant occurredAt
) {
}
