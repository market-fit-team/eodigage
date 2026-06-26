package com.marketfit.post.core.notification;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    private UUID id;

    @Column(name = "recipient_user_id", nullable = false, length = 200)
    private String recipientUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "target_post_id")
    private UUID targetPostId;

    @Column(name = "target_comment_id")
    private UUID targetCommentId;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static Notification commentCreated(
            String recipientUserId,
            UUID postId,
            UUID commentId
    ) {
        Notification notification = new Notification();
        notification.id = UUID.randomUUID();
        notification.recipientUserId = recipientUserId;
        notification.type = NotificationType.COMMENT_CREATED;
        notification.title = "새 댓글이 달렸습니다";
        notification.message = "AI 칼럼에 새로운 댓글이 등록되었습니다.";
        notification.targetPostId = postId;
        notification.targetCommentId = commentId;
        notification.read = false;
        return notification;
    }

    public void markRead(String currentUserId) {
        if (!recipientUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Notification owner mismatch.");
        }
        read = true;
    }

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }
}
