package com.example.server.infrastructure.persistence.media;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.example.server.core.media.MediaAttachment;
import com.example.server.core.media.MediaAttachmentStatus;

public interface MediaAttachmentRepository extends JpaRepository<MediaAttachment, Long> {

    Optional<MediaAttachment> findByIdAndOwnerIdAndDeletedAtIsNull(Long id, Long ownerId);

    List<MediaAttachment> findByPostIdInAndStatusAndDeletedAtIsNullOrderByPostIdAscSortOrderAscIdAsc(
            Collection<Long> postIds,
            MediaAttachmentStatus status
    );

    List<MediaAttachment> findByPostIdAndDeletedAtIsNullOrderBySortOrderAscIdAsc(Long postId);

    @Query("""
        select m
        from MediaAttachment m
        where m.id in :ids
          and m.owner.id = :ownerId
          and m.status = :status
          and m.deletedAt is null
        order by m.id asc
    """)
    List<MediaAttachment> findOwnedUploadableAttachments(
            @Param("ids") Collection<Long> ids,
            @Param("ownerId") Long ownerId,
            @Param("status") MediaAttachmentStatus status
    );

    long countByPostIdAndStatusAndDeletedAtIsNull(Long postId, MediaAttachmentStatus status);
}
