package com.example.server.infrastructure.storage.media;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class MediaObjectKeyGenerator {

    private MediaObjectKeyGenerator() {
    }

    public static String generate(Long userId, String contentType) {
        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        String extension = extensionOf(contentType);

        return "posts/%04d/%02d/%02d/%d/%s.%s".formatted(
                now.getYear(),
                now.getMonthValue(),
                now.getDayOfMonth(),
                userId,
                UUID.randomUUID(),
                extension
        );
    }

    private static String extensionOf(String contentType) {
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 이미지 타입입니다.");
        };
    }
}
