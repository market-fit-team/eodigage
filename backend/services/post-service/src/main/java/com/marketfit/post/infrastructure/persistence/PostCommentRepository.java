package com.marketfit.post.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marketfit.post.core.comment.PostComment;

public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {

    List<PostComment> findByPostIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(UUID postId);

    Optional<PostComment> findByIdAndDeletedAtIsNull(UUID id);
}
