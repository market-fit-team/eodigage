package com.example.server.infrastructure.persistence.scheduledpost;

import com.example.server.core.scheduledpost.ScheduledPost;
import com.example.server.core.user.User;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduledPostRepository extends JpaRepository<ScheduledPost, Long> {

    Page<ScheduledPost> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("""
        select sp.id
        from ScheduledPost sp
        where sp.status = 'SCHEDULED'
          and sp.scheduledAt <= :now
        order by sp.scheduledAt asc, sp.id asc
    """)
    List<Long> findDueIds(@Param("now") Instant now, Pageable pageable);

    @Modifying
    @Query("""
        update ScheduledPost sp
        set sp.status = 'PUBLISHING',
            sp.lockedAt = :now,
            sp.updatedAt = :now
        where sp.id = :id
          and sp.status = 'SCHEDULED'
    """)
    int claimForPublishing(@Param("id") Long id, @Param("now") Instant now);
}
