package com.example.server.infrastructure.persistence.notification;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.server.core.notification.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = {"actor", "targetPost", "sourcePost"})
    @Query("""
            select n
            from Notification n
            where n.recipient.id = :recipientId
            order by n.createdAt desc, n.id desc
            """)
    List<Notification> findFirstPage(@Param("recipientId") Long recipientId, Pageable pageable);

    @EntityGraph(attributePaths = {"actor", "targetPost", "sourcePost"})
    @Query("""
            select n
            from Notification n
            where n.recipient.id = :recipientId
              and (
                    n.createdAt < :cursorCreatedAt
                    or (n.createdAt = :cursorCreatedAt and n.id < :cursorId)
              )
            order by n.createdAt desc, n.id desc
            """)
    List<Notification> findNextPage(
            @Param("recipientId") Long recipientId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    long countByRecipientIdAndReadAtIsNull(Long recipientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Notification n
            set n.readAt = :readAt
            where n.recipient.id = :recipientId
              and n.readAt is null
            """)
    int markAllAsRead(
            @Param("recipientId") Long recipientId,
            @Param("readAt") Instant readAt
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            delete from Notification n
            where n.id = :notificationId
              and n.recipient.id = :recipientId
            """)
    int deleteByIdAndRecipientId(
            @Param("notificationId") Long notificationId,
            @Param("recipientId") Long recipientId
    );
}
