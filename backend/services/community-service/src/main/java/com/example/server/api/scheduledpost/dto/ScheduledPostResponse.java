package com.example.server.api.scheduledpost.dto;

import com.example.server.core.scheduledpost.ScheduledPost;
import com.example.server.core.scheduledpost.ScheduledPostStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

public record ScheduledPostResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Long parentId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Instant scheduledAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        ScheduledPostStatus status,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Long publishedPostId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Instant createdAt
) {
    public static ScheduledPostResponse from(ScheduledPost scheduledPost) {
        return new ScheduledPostResponse(
                scheduledPost.getId(),
                scheduledPost.getContent(),
                scheduledPost.getParent() != null ? scheduledPost.getParent().getId() : null,
                scheduledPost.getScheduledAt(),
                scheduledPost.getStatus(),
                scheduledPost.getPublishedPost() != null ? scheduledPost.getPublishedPost().getId() : null,
                scheduledPost.getCreatedAt()
        );
    }
}
