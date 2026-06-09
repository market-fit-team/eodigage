package com.example.server.core.scheduledpost.event;

import java.time.Instant;

import com.example.server.core.scheduledpost.ScheduledPost;

public record ScheduledPostPublishedEvent(
        Long userId,
        Long scheduledPostId,
        Long publishedPostId,
        String content,
        Instant publishedAt
) {
    public static ScheduledPostPublishedEvent from(ScheduledPost scheduledPost) {
        return new ScheduledPostPublishedEvent(
                scheduledPost.getUser().getId(),
                scheduledPost.getId(),
                scheduledPost.getPublishedPost() != null ? scheduledPost.getPublishedPost().getId() : null,
                scheduledPost.getContent(),
                scheduledPost.getPublishedAt()
        );
    }
}
