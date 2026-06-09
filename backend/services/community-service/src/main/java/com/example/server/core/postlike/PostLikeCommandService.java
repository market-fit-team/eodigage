package com.example.server.core.postlike;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.server.infrastructure.persistence.session.DbSessionContext;
import com.example.server.infrastructure.persistence.postlike.PostLikeRepository;
import com.example.server.core.notification.NotificationCommandService;
import com.example.server.core.post.Post;
import com.example.server.infrastructure.persistence.post.PostRepository;
import com.example.server.core.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostLikeCommandService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final DbSessionContext dbSessionContext;
    private final NotificationCommandService notificationCommandService;

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true),
            @CacheEvict(value = "postList", allEntries = true),
            @CacheEvict(value = "post", key = "#postId")
    })
    public boolean like(Long postId, User currentUser) {
        dbSessionContext.setCurrentUserId(currentUser.getId());

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "게시글을 찾을 수 없습니다. id=" + postId
                ));

        if (post.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "삭제된 게시글에는 좋아요를 누를 수 없습니다.");
        }

        if (postLikeRepository.existsByPostIdAndUserId(postId, currentUser.getId())) {
            return false;
        }

        try {
            postLikeRepository.saveAndFlush(new PostLike(post, currentUser));
        } catch (DataIntegrityViolationException ignored) {
            return false;
        }

        notificationCommandService.createLikeNotification(post, currentUser);
        return true;
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true),
            @CacheEvict(value = "postList", allEntries = true),
            @CacheEvict(value = "post", key = "#postId")
    })
    public void unlike(Long postId, User currentUser) {
        dbSessionContext.setCurrentUserId(currentUser.getId());

        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "게시글을 찾을 수 없습니다. id=" + postId
            );
        }

        postLikeRepository.deleteByPostIdAndUserId(postId, currentUser.getId());
    }
}
