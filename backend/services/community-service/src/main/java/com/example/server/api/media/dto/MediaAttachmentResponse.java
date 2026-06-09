package com.example.server.api.media.dto;

import com.example.server.core.media.MediaAttachment;

import io.swagger.v3.oas.annotations.media.Schema;

public record MediaAttachmentResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String url,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String contentType,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        long byteSize,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Integer width,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Integer height,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        String altText,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String status,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        int sortOrder
) {
    public static MediaAttachmentResponse from(MediaAttachment attachment, String url) {
        return new MediaAttachmentResponse(
                attachment.getId(),
                url,
                attachment.getContentType(),
                attachment.getByteSize(),
                attachment.getWidth(),
                attachment.getHeight(),
                attachment.getAltText(),
                attachment.getStatus().name(),
                attachment.getSortOrder()
        );
    }
}
