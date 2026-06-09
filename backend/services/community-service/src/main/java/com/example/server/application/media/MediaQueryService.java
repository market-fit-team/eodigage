package com.example.server.application.media;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.api.media.dto.MediaAttachmentResponse;
import com.example.server.core.media.MediaAttachment;
import com.example.server.core.media.MediaAttachmentStatus;
import com.example.server.core.user.User;
import com.example.server.infrastructure.persistence.media.MediaAttachmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaQueryService {

    private final MediaAttachmentRepository mediaRepository;
    private final MediaAttachmentResponseAssembler responseAssembler;

    @Transactional(readOnly = true)
    public Map<Long, List<MediaAttachmentResponse>> findResponsesByPostIds(List<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Map.of();
        }

        List<MediaAttachment> attachments = mediaRepository
                .findByPostIdInAndStatusAndDeletedAtIsNullOrderByPostIdAscSortOrderAscIdAsc(
                        postIds,
                        MediaAttachmentStatus.ATTACHED
                );

        return attachments.stream()
                .collect(Collectors.groupingBy(
                        attachment -> attachment.getPost().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(responseAssembler::toResponse, Collectors.toList())
                ));
    }

    @Transactional(readOnly = true)
    public MediaAttachmentResponse getOwnedResponse(User currentUser, Long mediaId) {
        MediaAttachment attachment = mediaRepository.findByIdAndOwnerIdAndDeletedAtIsNull(
                        mediaId,
                        currentUser.getId()
                )
                .orElseThrow(() -> new IllegalArgumentException("미디어를 찾을 수 없습니다."));

        return responseAssembler.toResponse(attachment);
    }
}
