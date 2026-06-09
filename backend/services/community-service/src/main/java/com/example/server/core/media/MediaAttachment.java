package com.example.server.core.media;

import com.example.server.core.post.Post;
import com.example.server.core.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Entity
@Table(name = "post_media_attachments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MediaAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false)
    private String bucket;

    @Column(name = "object_key", nullable = false, length = 1024, unique = true)
    private String objectKey;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "byte_size", nullable = false)
    private long byteSize;

    private Integer width;

    private Integer height;

    @Column(name = "alt_text", length = 1500)
    private String altText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaAttachmentStatus status;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "attached_at")
    private Instant attachedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    private MediaAttachment(
            User owner,
            String bucket,
            String objectKey,
            String originalFilename,
            String contentType,
            long byteSize,
            Integer width,
            Integer height,
            String altText
    ) {
        this.owner = owner;
        this.bucket = bucket;
        this.objectKey = objectKey;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.byteSize = byteSize;
        this.width = width;
        this.height = height;
        this.altText = altText;
        this.status = MediaAttachmentStatus.UPLOADED;
        this.sortOrder = 0;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static MediaAttachment uploaded(
            User owner,
            String bucket,
            String objectKey,
            String originalFilename,
            String contentType,
            long byteSize,
            Integer width,
            Integer height,
            String altText
    ) {
        return new MediaAttachment(
                owner,
                bucket,
                objectKey,
                originalFilename,
                contentType,
                byteSize,
                width,
                height,
                altText
        );
    }

    public void attachTo(Post post, int sortOrder) {
        if (this.status != MediaAttachmentStatus.UPLOADED) {
            throw new IllegalStateException("업로드 상태의 미디어만 게시글에 첨부할 수 있습니다.");
        }
        this.post = post;
        this.sortOrder = sortOrder;
        this.status = MediaAttachmentStatus.ATTACHED;
        this.attachedAt = Instant.now();
        this.updatedAt = this.attachedAt;
    }

    public void updateAltText(String altText) {
        this.altText = altText;
        this.updatedAt = Instant.now();
    }

    public void markDeleted() {
        this.status = MediaAttachmentStatus.DELETED;
        this.deletedAt = Instant.now();
        this.updatedAt = this.deletedAt;
    }

    public boolean isOwnedBy(Long userId) {
        return owner != null && owner.getId().equals(userId);
    }

    public boolean isAttached() {
        return status == MediaAttachmentStatus.ATTACHED;
    }
}
