package com.marketfit.post.core.comment;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "post_comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostComment {

    @Id
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "user_id", nullable = false, length = 200)
    private String userId;

    @Column(name = "author_name", nullable = false, length = 120)
    private String authorName;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public static PostComment create(
            UUID postId,
            String userId,
            String authorName,
            String content
    ) {
        PostComment comment = new PostComment();
        comment.id = UUID.randomUUID();
        comment.postId = postId;
        comment.userId = userId;
        comment.authorName = authorName == null || authorName.isBlank() ? userId : authorName.trim();
        comment.updateContent(content);
        return comment;
    }

    public void updateContent(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Comment content must not be blank.");
        }
        this.content = content.trim();
    }

    public void delete() {
        if (deletedAt == null) {
            deletedAt = Instant.now();
        }
    }

    public boolean isWrittenBy(String userId) {
        return this.userId.equals(userId);
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
