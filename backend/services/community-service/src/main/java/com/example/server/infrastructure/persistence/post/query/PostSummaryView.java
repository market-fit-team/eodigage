package com.example.server.infrastructure.persistence.post.query;

import java.time.Instant;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "post_summary_view")
@Immutable
@Getter
public class PostSummaryView {

    @Id
    private Long id;

    private String content;

    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_picture_url")
    private String authorPictureUrl;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "root_id")
    private Long rootId;

    private int depth;

    @Column(name = "like_count")
    private Long likeCount;

    @Column(name = "reply_count")
    private Long replyCount;

    @Column(name = "liked_by_me")
    private Boolean likedByMe;

    private boolean deleted;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
