package com.example.server.application.notification.support;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import org.springframework.stereotype.Component;

@Component
public class NotificationCursorCodec {

    private static final String DELIMITER = "|";

    public String encode(Instant createdAt, Long id) {
        String raw = createdAt.toString() + DELIMITER + id;
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public CursorToken decode(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return CursorToken.firstPage();
        }

        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = raw.split("\\|", 2);
            if (parts.length != 2) {
                throw new IllegalArgumentException("잘못된 cursor 형식입니다.");
            }

            return new CursorToken(Instant.parse(parts[0]), Long.valueOf(parts[1]));
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("유효하지 않은 cursor입니다.", ex);
        }
    }

    public record CursorToken(Instant createdAt, Long id) {
        public static CursorToken firstPage() {
            return new CursorToken(null, null);
        }

        public boolean isFirstPage() {
            return createdAt == null || id == null;
        }
    }
}
