package com.example.server.core.scheduledpost;

import java.time.Instant;

import com.example.server.core.post.Post;
import com.example.server.core.post.PostDraft;
import com.example.server.infrastructure.persistence.post.PostRepository;
import com.example.server.infrastructure.persistence.scheduledpost.ScheduledPostRepository;
import com.example.server.infrastructure.persistence.session.DbSessionContext;
import com.example.server.core.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ScheduledPostCommandService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostRepository postRepository;
    private final DbSessionContext dbSessionContext;

    @Transactional
    public ScheduledPost create(User currentUser, PostDraft draft, Long parentId, Instant scheduledAt) {
        dbSessionContext.setCurrentUserId(currentUser.getId());
        validateScheduledAt(scheduledAt);

        Post parent = null;
        if (parentId != null) {
            parent = postRepository.findById(parentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

            if (parent.isDeleted()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "삭제된 게시글에는 예약 답글을 작성할 수 없습니다.");
            }
        }

        ScheduledPost scheduledPost = ScheduledPost.create(
                currentUser,
                draft,
                parent,
                scheduledAt
        );

        scheduledPostRepository.save(scheduledPost);

        return scheduledPost;
    }

    @Transactional
    public ScheduledPost update(Long id, User currentUser, String content, Instant scheduledAt) {
        dbSessionContext.setCurrentUserId(currentUser.getId());
        ScheduledPost scheduledPost = scheduledPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!scheduledPost.isOwnedBy(currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        validateScheduledAt(scheduledAt);

        scheduledPost.updateContentAndScheduledAt(content, scheduledAt);
        return scheduledPost;
    }

    @Transactional
    public void cancel(Long id, User currentUser) {
        dbSessionContext.setCurrentUserId(currentUser.getId());
        ScheduledPost scheduledPost = scheduledPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!scheduledPost.isOwnedBy(currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        scheduledPost.cancel();
    }

    private void validateScheduledAt(Instant scheduledAt) {
        if (!scheduledAt.isAfter(Instant.now().plusSeconds(60))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "예약 시각은 현재 시각보다 1분 이후여야 합니다.");
        }
    }
}
