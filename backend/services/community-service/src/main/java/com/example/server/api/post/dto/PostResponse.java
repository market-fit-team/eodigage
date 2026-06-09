package com.example.server.api.post.dto;

import java.time.Instant;
import java.util.List;

import com.example.server.core.post.Post;
import com.example.server.core.user.User;
import com.example.server.api.media.dto.MediaAttachmentResponse;

public record PostResponse(
        Long id,
        String content,
        Long authorId,
        String authorName,
        Long parentId,
        Long rootId,
        int depth,
        boolean deleted,
        List<MediaAttachmentResponse> mediaAttachments,
        Instant createdAt,
        Instant updatedAt
) {
    public static PostResponse from(Post post) {
        return from(post, List.of());
    }

    public static PostResponse from(Post post, List<MediaAttachmentResponse> mediaAttachments) {
        User author = post.getUser();
        return new PostResponse(
                post.getId(),
                post.getContent(),
                author.getId(),
                author.getName(),
                post.getParent() == null ? null : post.getParent().getId(),
                post.getRoot() == null ? null : post.getRoot().getId(),
                post.getDepth(),
                post.isDeleted(),
                mediaAttachments,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
