package com.example.server.core.post;

import java.time.Instant;

import com.example.server.core.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import com.example.server.core.media.MediaAttachment;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @SequenceGenerator(name = "posts_seq", sequenceName = "posts_id_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "posts_seq")
    private Long id;

    @Column(nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_posts_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", foreignKey = @ForeignKey(name = "fk_posts_parent"))
    private Post parent;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "root_id", nullable = false, foreignKey = @ForeignKey(name = "fk_posts_root"))
    private Post root;

    @Column(nullable = false)
    private int depth;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC, id ASC")
    private List<MediaAttachment> mediaAttachments = new ArrayList<>();

    public static Post createRoot(String content, User author) {
        Post post = new Post();
        post.content = content;
        post.user = author;
        post.root = post;
        post.depth = 0;
        return post;
    }

    public static Post createReply(String content, User author, Post parent) {
        Post post = new Post();
        post.content = content;
        post.user = author;
        post.parent = parent;
        post.root = parent.root != null ? parent.root : parent;
        post.depth = parent.depth + 1;
        return post;
    }

    public void markAsRoot() {
        this.root = this;
    }

    public void updateContent(String content) {
        this.content = content;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }

    public boolean isWrittenBy(Long userId) {
        return user != null && user.getId().equals(userId);
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
