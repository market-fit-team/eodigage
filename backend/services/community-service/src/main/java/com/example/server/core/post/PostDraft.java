package com.example.server.core.post;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record PostDraft(
        String content,
        List<Long> mediaAttachmentIds
) {
    public static final int MAX_MEDIA_ATTACHMENTS_PER_POST = 4;

    public PostDraft {
        content = content == null ? "" : content;
        mediaAttachmentIds = mediaAttachmentIds == null ? List.of() : List.copyOf(mediaAttachmentIds);
        validateContentOrMedia(content, mediaAttachmentIds);
        validateMediaAttachmentLimit(mediaAttachmentIds);
    }

    private static void validateContentOrMedia(String content, List<Long> mediaAttachmentIds) {
        boolean hasContent = content != null && !content.isBlank();
        boolean hasMedia = !mediaAttachmentIds.isEmpty();

        if (!hasContent && !hasMedia) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내용 또는 이미지 중 하나는 필요합니다.");
        }
    }

    private static void validateMediaAttachmentLimit(List<Long> mediaAttachmentIds) {
        if (mediaAttachmentIds.size() > MAX_MEDIA_ATTACHMENTS_PER_POST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "게시글 하나에는 이미지를 최대 4개까지 첨부할 수 있습니다.");
        }
    }
}
