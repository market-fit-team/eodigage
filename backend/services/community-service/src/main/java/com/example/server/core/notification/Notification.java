package com.example.server.core.notification;

import java.time.Instant;

import com.example.server.core.post.Post;
import com.example.server.core.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "notifications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_post_id", nullable = false)
    private Post targetPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_post_id")
    private Post sourcePost;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    private Notification(
            User recipient,
            User actor,
            NotificationType type,
            Post targetPost,
            Post sourcePost
    ) {
        this.recipient = recipient;
        this.actor = actor;
        this.type = type;
        this.targetPost = targetPost;
        this.sourcePost = sourcePost;
    }

    public static Notification reply(User recipient, User actor, Post targetPost, Post sourcePost) {
        return new Notification(recipient, actor, NotificationType.POST_REPLY, targetPost, sourcePost);
    }

    public static Notification like(User recipient, User actor, Post targetPost) {
        return new Notification(recipient, actor, NotificationType.POST_LIKE, targetPost, null);
    }

    public boolean isUnread() {
        return readAt == null;
    }

    public void markAsRead() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
