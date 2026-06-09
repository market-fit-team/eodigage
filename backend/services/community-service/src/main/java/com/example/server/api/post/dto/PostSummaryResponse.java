package com.example.server.api.post.dto;

import java.time.Instant;
import java.util.List;

import com.example.server.infrastructure.persistence.post.query.PostSummaryView;
import com.example.server.api.media.dto.MediaAttachmentResponse;

import io.swagger.v3.oas.annotations.media.Schema;

public record PostSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long authorId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String authorName,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        String authorPictureUrl,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Long parentId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long rootId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        int depth,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long likeCount,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long replyCount,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        boolean likedByMe,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        boolean deleted,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        List<MediaAttachmentResponse> mediaAttachments,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Instant updatedAt
) {
    public static PostSummaryResponse from(PostSummaryView view) {
        return from(view, List.of());
    }

    public static PostSummaryResponse from(PostSummaryView view, List<MediaAttachmentResponse> mediaAttachments) {
        return new PostSummaryResponse(
                view.getId(),
                view.getContent(),
                view.getAuthorId(),
                view.getAuthorName(),
                view.getAuthorPictureUrl(),
                view.getParentId(),
                view.getRootId(),
                view.getDepth(),
                view.getLikeCount(),
                view.getReplyCount(),
                Boolean.TRUE.equals(view.getLikedByMe()),
                view.isDeleted(),
                mediaAttachments,
                view.getCreatedAt(),
                view.getUpdatedAt()
        );
    }
}
