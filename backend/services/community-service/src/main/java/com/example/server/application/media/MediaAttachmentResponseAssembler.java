package com.example.server.application.media;

import org.springframework.stereotype.Component;

import com.example.server.api.media.dto.MediaAttachmentResponse;
import com.example.server.core.media.MediaAttachment;
import com.example.server.core.media.MediaStoragePort;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MediaAttachmentResponseAssembler {

    private final MediaStoragePort mediaStoragePort;

    public MediaAttachmentResponse toResponse(MediaAttachment attachment) {
        String url = mediaStoragePort.presignGetUrl(attachment.getObjectKey()).toString();
        return MediaAttachmentResponse.from(attachment, url);
    }
}
