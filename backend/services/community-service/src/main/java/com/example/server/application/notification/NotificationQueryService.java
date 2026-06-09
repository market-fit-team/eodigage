package com.example.server.application.notification;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.api.notification.dto.NotificationCursorPageResponse;
import com.example.server.api.notification.dto.NotificationResponse;
import com.example.server.api.notification.dto.UnreadNotificationCountResponse;
import com.example.server.application.notification.support.NotificationCursorCodec;
import com.example.server.core.notification.Notification;
import com.example.server.infrastructure.persistence.session.DbSessionContext;
import com.example.server.infrastructure.persistence.notification.NotificationRepository;
import com.example.server.core.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationQueryService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 50;

    private final NotificationRepository notificationRepository;
    private final NotificationCursorCodec notificationCursorCodec;
    private final DbSessionContext dbSessionContext;

    public NotificationCursorPageResponse<NotificationResponse> findNotifications(User currentUser, int size, String cursor) {
        dbSessionContext.setCurrentUserId(currentUser.getId());

        int normalizedSize = normalizeSize(size);
        NotificationCursorCodec.CursorToken token = notificationCursorCodec.decode(cursor);
        Pageable limit = PageRequest.of(0, normalizedSize + 1);

        List<Notification> rows = token.isFirstPage()
                ? notificationRepository.findFirstPage(currentUser.getId(), limit)
                : notificationRepository.findNextPage(currentUser.getId(), token.createdAt(), token.id(), limit);

        boolean hasNext = rows.size() > normalizedSize;
        List<Notification> pageRows = hasNext ? rows.subList(0, normalizedSize) : rows;

        List<NotificationResponse> items = pageRows.stream()
                .map(NotificationResponse::from)
                .toList();

        String nextCursor = null;
        if (hasNext && !pageRows.isEmpty()) {
            Notification last = pageRows.get(pageRows.size() - 1);
            nextCursor = notificationCursorCodec.encode(last.getCreatedAt(), last.getId());
        }

        return new NotificationCursorPageResponse<>(items, nextCursor, hasNext);
    }

    public UnreadNotificationCountResponse countUnread(User currentUser) {
        dbSessionContext.setCurrentUserId(currentUser.getId());
        long unread = notificationRepository.countByRecipientIdAndReadAtIsNull(currentUser.getId());
        return new UnreadNotificationCountResponse(unread);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }
}
