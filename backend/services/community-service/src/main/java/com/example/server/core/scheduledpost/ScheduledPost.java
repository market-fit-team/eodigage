package com.example.server.core.scheduledpost;

import com.example.server.core.post.Post;
import com.example.server.core.post.PostDraft;
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
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "scheduled_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ScheduledPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Post parent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "media_attachment_ids", nullable = false, columnDefinition = "jsonb")
    private List<Long> mediaAttachmentIds = new ArrayList<>();

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ScheduledPostStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_post_id")
    private Post publishedPost;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "failed_reason", columnDefinition = "text")
    private String failedReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static ScheduledPost create(User user, PostDraft draft, Post parent, Instant scheduledAt) {
        ScheduledPost scheduledPost = new ScheduledPost();
        scheduledPost.user = user;
        scheduledPost.content = draft.content();
        scheduledPost.parent = parent;
        scheduledPost.mediaAttachmentIds = new ArrayList<>(draft.mediaAttachmentIds());
        scheduledPost.scheduledAt = scheduledAt;
        scheduledPost.status = ScheduledPostStatus.SCHEDULED;
        scheduledPost.createdAt = Instant.now();
        scheduledPost.updatedAt = scheduledPost.createdAt;
        return scheduledPost;
    }

    public PostDraft toPostDraft() {
        return new PostDraft(content, mediaAttachmentIds);
    }

    public boolean isOwnedBy(User user) {
        return this.user.getId().equals(user.getId());
    }

    public void cancel() {
        if (status != ScheduledPostStatus.SCHEDULED) {
            throw new IllegalStateException("예약 상태에서만 취소할 수 있습니다.");
        }
        this.status = ScheduledPostStatus.CANCELED;
        this.updatedAt = Instant.now();
    }

    public void updateContentAndScheduledAt(String content, Instant scheduledAt) {
        if (status != ScheduledPostStatus.SCHEDULED) {
            throw new IllegalStateException("예약 상태에서만 수정할 수 있습니다.");
        }
        this.content = content;
        this.scheduledAt = scheduledAt;
        this.updatedAt = Instant.now();
    }

    public void markPublishing() {
        this.status = ScheduledPostStatus.PUBLISHING;
        this.lockedAt = Instant.now();
        this.updatedAt = this.lockedAt;
    }

    public void markPublished(Post post) {
        this.status = ScheduledPostStatus.PUBLISHED;
        this.publishedPost = post;
        this.publishedAt = Instant.now();
        this.updatedAt = this.publishedAt;
    }

    public void markFailed(String reason) {
        this.status = ScheduledPostStatus.FAILED;
        this.failedReason = reason;
        this.updatedAt = Instant.now();
    }
}
