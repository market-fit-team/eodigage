package com.example.server.infrastructure.messaging.scheduledpost;

import java.time.Instant;
import java.util.UUID;

public record ScheduledPostPublishMessage(
        UUID eventId,
        Long scheduledPostId,
        Long userId,
        Instant scheduledAt,
        Instant publishedRequestAt
) {
}
