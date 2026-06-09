package com.example.server.application.scheduledpost;

import java.time.Instant;

public record ScheduledPostPublishedPayload(
        Long scheduledPostId,
        Long publishedPostId,
        String content,
        Instant publishedAt
) {
}
