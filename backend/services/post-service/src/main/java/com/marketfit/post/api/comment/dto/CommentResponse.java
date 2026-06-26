package com.marketfit.post.api.comment.dto;

import java.time.Instant;
import java.util.UUID;

import com.marketfit.post.core.comment.PostComment;

public record CommentResponse(
        UUID id,
        UUID postId,
        String userId,
        String authorName,
        String content,
        boolean canEdit,
        Instant createdAt,
        Instant updatedAt
) {
    public static CommentResponse from(PostComment comment, String currentUserId) {
        return new CommentResponse(
                comment.getId(),
                comment.getPostId(),
                comment.getUserId(),
                comment.getAuthorName(),
                comment.getContent(),
                currentUserId != null && comment.isWrittenBy(currentUserId),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
