package com.example.server.application.media;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.api.media.dto.MediaAttachmentResponse;
import com.example.server.core.media.MediaAttachment;
import com.example.server.core.media.MediaCommandService;
import com.example.server.core.media.MediaUploadFile;
import com.example.server.core.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MediaAttachmentApplicationService {

    private final MediaCommandService mediaCommandService;
    private final MediaAttachmentResponseAssembler responseAssembler;

    @Transactional
    public MediaAttachmentResponse upload(User currentUser, MultipartFile file, String altText) {
        MediaAttachment attachment = mediaCommandService.upload(
                currentUser,
                new MultipartMediaUploadFile(file),
                altText
        );
        return responseAssembler.toResponse(attachment);
    }

    @Transactional
    public MediaAttachmentResponse updateAltText(User currentUser, Long mediaId, String altText) {
        MediaAttachment attachment = mediaCommandService.updateAltText(currentUser, mediaId, altText);
        return responseAssembler.toResponse(attachment);
    }

    @Transactional
    public void deleteUnattached(User currentUser, Long mediaId) {
        mediaCommandService.deleteUnattached(currentUser, mediaId);
    }

    private record MultipartMediaUploadFile(MultipartFile file) implements MediaUploadFile {

        @Override
        public String originalFilename() {
            return file.getOriginalFilename();
        }

        @Override
        public String contentType() {
            return file.getContentType();
        }

        @Override
        public long size() {
            return file.getSize();
        }

        @Override
        public InputStream inputStream() throws IOException {
            return file.getInputStream();
        }
    }
}
