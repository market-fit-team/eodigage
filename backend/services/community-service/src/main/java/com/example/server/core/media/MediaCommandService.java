package com.example.server.core.media;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.server.core.user.User;
import com.example.server.infrastructure.persistence.media.MediaAttachmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaCommandService {

    private final MediaStoragePort mediaStoragePort;
    private final MediaAttachmentRepository mediaRepository;

    @Transactional
    public MediaAttachment upload(User currentUser, MediaUploadFile file, String altText) {
        StoredMediaObject storedObject = mediaStoragePort.uploadImage(currentUser.getId(), file);

        MediaAttachment attachment = MediaAttachment.uploaded(
                currentUser,
                storedObject.bucket(),
                storedObject.objectKey(),
                file.originalFilename(),
                storedObject.contentType(),
                storedObject.byteSize(),
                storedObject.width(),
                storedObject.height(),
                normalizeAltText(altText)
        );

        return mediaRepository.save(attachment);
    }

    @Transactional
    public MediaAttachment updateAltText(User currentUser, Long mediaId, String altText) {
        MediaAttachment attachment = mediaRepository.findByIdAndOwnerIdAndDeletedAtIsNull(
                        mediaId,
                        currentUser.getId()
                )
                .orElseThrow(() -> new IllegalArgumentException("미디어를 찾을 수 없습니다."));

        attachment.updateAltText(normalizeAltText(altText));
        return attachment;
    }

    @Transactional
    public void deleteUnattached(User currentUser, Long mediaId) {
        MediaAttachment attachment = mediaRepository.findByIdAndOwnerIdAndDeletedAtIsNull(
                        mediaId,
                        currentUser.getId()
                )
                .orElseThrow(() -> new IllegalArgumentException("미디어를 찾을 수 없습니다."));

        if (attachment.isAttached()) {
            throw new IllegalStateException("이미 게시글에 연결된 미디어는 이 API로 삭제할 수 없습니다.");
        }

        attachment.markDeleted();
        mediaStoragePort.deleteObject(attachment.getObjectKey());
    }

    private String normalizeAltText(String altText) {
        if (altText == null || altText.isBlank()) {
            return null;
        }
        String normalized = altText.trim();
        if (normalized.length() > 1500) {
            throw new IllegalArgumentException("이미지 설명은 1500자를 초과할 수 없습니다.");
        }
        return normalized;
    }
}
