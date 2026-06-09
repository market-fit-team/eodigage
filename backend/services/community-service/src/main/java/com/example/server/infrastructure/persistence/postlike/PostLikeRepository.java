package com.example.server.infrastructure.persistence.postlike;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.core.postlike.PostLike;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    /**
     * 특정 사용자가 특정 게시글에 좋아요를 이미 클릭했는지 여부를 조회합니다.
     * @param postId 게시글 ID
     * @param userId 사용자 ID
     * @return 이미 좋아요를 누른 상태인 경우 true, 그렇지 않은 경우 false
     */
    boolean existsByPostIdAndUserId(Long postId, Long userId);

    /**
     * 특정 사용자가 특정 게시글에 누른 좋아요 행을 데이터베이스에서 물리 삭제(취소)합니다.
     * @param postId 게시글 ID
     * @param userId 사용자 ID
     */
    void deleteByPostIdAndUserId(Long postId, Long userId);
}
