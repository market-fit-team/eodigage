package com.example.server.core.media;

public record StoredMediaObject(
        String bucket,
        String objectKey,
        String contentType,
        long byteSize,
        int width,
        int height
) {
}
