package com.example.server.api.scheduledpost.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record CreateScheduledPostRequest(
        @Size(max = 500)
        String content,

        Long parentId,

        List<Long> mediaAttachmentIds,

        @NotNull
        Instant scheduledAt
) {
    public List<Long> safeMediaAttachmentIds() {
        return mediaAttachmentIds == null ? List.of() : mediaAttachmentIds;
    }
}
