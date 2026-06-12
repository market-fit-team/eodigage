package com.example.server.core.post;

import java.util.List;
import java.util.Map;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.server.infrastructure.persistence.post.PostRepository;
import com.example.server.infrastructure.persistence.session.DbSessionContext;
import com.example.server.core.notification.NotificationCommandService;
import com.example.server.core.semantic.PostSemanticSyncType;
import com.example.server.core.semantic.event.PostSemanticSyncEvent;
import com.example.server.core.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostCommandService {

    private final PostRepository postRepository;
    private final DbSessionContext dbSessionContext;
    private final NotificationCommandService notificationCommandService;
    private final com.example.server.infrastructure.persistence.media.MediaAttachmentRepository mediaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public Post create(PostDraft draft, User currentUser) {
        return createRootPost(currentUser, draft);
    }

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public Post createReply(Long parentId, PostDraft draft, User currentUser) {
        Post parent = getPost(parentId);
        return createReplyPost(currentUser, parent, draft);
    }

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public Post createRootFromScheduled(User currentUser, PostDraft draft) {
        return createRootPost(currentUser, draft);
    }

    @Transactional
    @CacheEvict(value = "posts", allEntries = true)
    public Post createReplyFromScheduled(User currentUser, Post parent, PostDraft draft) {
        return createReplyPost(currentUser, parent, draft);
    }

    private Post createRootPost(User currentUser, PostDraft draft) {
        dbSessionContext.setCurrentUserId(currentUser.getId());

        Post post = Post.createRoot(draft.content(), currentUser);
        Post saved = postRepository.saveAndFlush(post);
        saved.markAsRoot();
        attachMedia(saved, currentUser, draft.mediaAttachmentIds());
        publishSemanticSync(saved.getId(), PostSemanticSyncType.INDEX_UPSERT);

        return saved;
    }

    private Post createReplyPost(User currentUser, Post parent, PostDraft draft) {
        if (parent.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "삭제된 게시글에는 댓글을 작성할 수 없습니다.");
        }

        dbSessionContext.setCurrentUserId(currentUser.getId());

        Post reply = Post.createReply(draft.content(), currentUser, parent);
        Post saved = postRepository.saveAndFlush(reply);
        notificationCommandService.createReplyNotification(parent, saved, currentUser);
        attachMedia(saved, currentUser, draft.mediaAttachmentIds());
        publishSemanticSync(saved.getId(), PostSemanticSyncType.INDEX_UPSERT);

        return saved;
    }

    @Transactional
    @Caching(
            evict = {
                    @CacheEvict(value = "post", key = "#id"),
                    @CacheEvict(value = "posts", allEntries = true)
            }
    )
    public Post update(Long id, String content, User currentUser) {
        Post post = getPost(id);
        validateOwner(post, currentUser);

        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "삭제된 게시글은 수정할 수 없습니다.");
        }

        dbSessionContext.setCurrentUserId(currentUser.getId());
        post.updateContent(content);
        publishSemanticSync(post.getId(), PostSemanticSyncType.INDEX_UPSERT);

        return post;
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "post", key = "#id"),
            @CacheEvict(value = "posts", allEntries = true)
    })
    public void delete(Long id, User currentUser) {
        Post post = getPost(id);
        validateOwner(post, currentUser);

        if (post.isDeleted()) {
            return;
        }

        dbSessionContext.setCurrentUserId(currentUser.getId());
        post.softDelete();
        publishSemanticSync(post.getId(), PostSemanticSyncType.STATUS_UPDATE);
    }

    private Post getPost(Long id) {
        return postRepository.findWithUserById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "게시글을 찾을 수 없습니다. id=" + id
                ));
    }

    private void validateOwner(Post post, User currentUser) {
        if (!post.isWrittenBy(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "자신의 게시글만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private void attachMedia(Post post, User currentUser, List<Long> mediaAttachmentIds) {
        if (mediaAttachmentIds == null || mediaAttachmentIds.isEmpty()) {
            return;
        }

        if (mediaAttachmentIds.size() > PostDraft.MAX_MEDIA_ATTACHMENTS_PER_POST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "게시글 하나에는 이미지를 최대 4개까지 첨부할 수 있습니다.");
        }

        List<com.example.server.core.media.MediaAttachment> attachments = mediaRepository.findOwnedUploadableAttachments(
                mediaAttachmentIds,
                currentUser.getId(),
                com.example.server.core.media.MediaAttachmentStatus.UPLOADED
        );

        if (attachments.size() != mediaAttachmentIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부할 수 없는 이미지가 포함되어 있습니다.");
        }

        Map<Long, com.example.server.core.media.MediaAttachment> byId = attachments.stream()
                .collect(java.util.stream.Collectors.toMap(com.example.server.core.media.MediaAttachment::getId, java.util.function.Function.identity()));

        for (int i = 0; i < mediaAttachmentIds.size(); i++) {
            Long mediaId = mediaAttachmentIds.get(i);
            com.example.server.core.media.MediaAttachment attachment = byId.get(mediaId);
            if (attachment == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부할 수 없는 이미지가 포함되어 있습니다.");
            }
            attachment.attachTo(post, i);
        }
    }

    private void publishSemanticSync(Long postId, PostSemanticSyncType type) {
        eventPublisher.publishEvent(new PostSemanticSyncEvent(postId, type));
    }
}
