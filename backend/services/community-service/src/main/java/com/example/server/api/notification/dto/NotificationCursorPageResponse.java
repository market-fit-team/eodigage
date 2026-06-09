package com.example.server.api.notification.dto;

import java.util.List;

public record NotificationCursorPageResponse<T>(
        List<T> items,
        String nextCursor,
        boolean hasNext
) {
}
