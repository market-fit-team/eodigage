package com.example.server.infrastructure.persistence.post.query;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostSummaryRepository extends JpaRepository<PostSummaryView, Long> {

    Page<PostSummaryView> findByParentIdIsNullAndDeletedFalse(Pageable pageable);

    @Query("""
            select p
            from PostSummaryView p
            where p.parentId is null
              and p.deleted = false
            order by p.createdAt desc, p.id desc
            """)
    List<PostSummaryView> findFirstFeedCursorPage(Pageable pageable);

    @Query("""
            select p
            from PostSummaryView p
            where p.parentId is null
              and p.deleted = false
              and (p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId))
            order by p.createdAt desc, p.id desc
            """)
    List<PostSummaryView> findNextFeedCursorPage(
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    @Query("""
            select p
            from PostSummaryView p
            where p.parentId = :parentId
              and p.deleted = false
            order by p.createdAt asc, p.id asc
            """)
    List<PostSummaryView> findFirstRepliesCursorPage(@Param("parentId") Long parentId, Pageable pageable);

    @Query("""
            select p
            from PostSummaryView p
            where p.parentId = :parentId
              and p.deleted = false
              and (p.createdAt > :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id > :cursorId))
            order by p.createdAt asc, p.id asc
            """)
    List<PostSummaryView> findNextRepliesCursorPage(
            @Param("parentId") Long parentId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    List<PostSummaryView> findByIdIn(List<Long> ids);
}
