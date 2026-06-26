package com.marketfit.post.application.comment;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.marketfit.post.api.comment.dto.CommentResponse;
import com.marketfit.post.application.notification.CommentNotificationService;
import com.marketfit.post.core.comment.PostComment;
import com.marketfit.post.core.post.Post;
import com.marketfit.post.core.post.PostStatus;
import com.marketfit.post.core.post.PostVisibility;
import com.marketfit.post.infrastructure.persistence.PostCommentRepository;
import com.marketfit.post.infrastructure.persistence.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostCommentService {

    private final PostRepository postRepository;
    private final PostCommentRepository commentRepository;
    private final CommentNotificationService notificationService;

    @Transactional(readOnly = true)
    public List<CommentResponse> findByPostId(UUID postId, String currentUserId) {
        ensurePublicPostExists(postId);
        return commentRepository.findByPostIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(postId)
                .stream()
                .map(comment -> CommentResponse.from(comment, currentUserId))
                .toList();
    }

    @Transactional
    public CommentResponse create(
            UUID postId,
            String userId,
            String authorName,
            String content
    ) {
        ensurePublicPostExists(postId);
        PostComment comment = commentRepository.save(PostComment.create(
                postId,
                userId,
                authorName,
                content
        ));
        notificationService.publishCommentCreated(comment);
        return CommentResponse.from(comment, userId);
    }

    @Transactional
    public CommentResponse update(
            UUID postId,
            UUID commentId,
            String userId,
            String content
    ) {
        ensurePublicPostExists(postId);
        PostComment comment = findComment(postId, commentId);
        if (!comment.isWrittenBy(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "댓글을 수정할 권한이 없습니다.");
        }
        comment.updateContent(content);
        return CommentResponse.from(comment, userId);
    }

    @Transactional
    public void delete(UUID postId, UUID commentId, String userId) {
        ensurePublicPostExists(postId);
        PostComment comment = findComment(postId, commentId);
        if (!comment.isWrittenBy(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "댓글을 삭제할 권한이 없습니다.");
        }
        comment.delete();
    }

    private Post ensurePublicPostExists(UUID postId) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (post.getStatus() != PostStatus.PUBLISHED || post.getVisibility() != PostVisibility.PUBLIC) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }
        return post;
    }

    private PostComment findComment(UUID postId, UUID commentId) {
        PostComment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."));
        if (!comment.getPostId().equals(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다.");
        }
        return comment;
    }
}
