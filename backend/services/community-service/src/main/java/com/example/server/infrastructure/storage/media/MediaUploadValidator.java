package com.example.server.infrastructure.storage.media;

import com.example.server.core.media.MediaUploadFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

public final class MediaUploadValidator {

    static {
        ImageIO.scanForPlugins();
    }

    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private MediaUploadValidator() {
    }

    public static ImageDimensions validate(MediaUploadFile file) {
        if (file == null || file.size() <= 0) {
            throw new IllegalArgumentException("이미지 파일이 비어 있습니다.");
        }

        if (file.size() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("이미지 파일은 10MB를 초과할 수 없습니다.");
        }

        String contentType = file.contentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식입니다.");
        }

        try (InputStream inputStream = file.inputStream()) {
            BufferedImage image = ImageIO.read(inputStream);
            if (image == null) {
                throw new IllegalArgumentException("이미지 파일을 읽을 수 없습니다.");
            }
            return new ImageDimensions(image.getWidth(), image.getHeight());
        } catch (IOException e) {
            throw new IllegalArgumentException("이미지 파일 검증에 실패했습니다.", e);
        }
    }
}
