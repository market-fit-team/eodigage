package com.marketfit.post.application.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.marketfit.post.api.notification.dto.NotificationResponse;
import com.marketfit.post.core.notification.Notification;
import com.marketfit.post.infrastructure.persistence.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> findMine(String userId) {
        return notificationRepository.findTop30ByRecipientUserIdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public NotificationResponse markRead(UUID notificationId, String userId) {
        Notification notification = notificationRepository.findByIdAndRecipientUserId(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."));
        notification.markRead(userId);
        return NotificationResponse.from(notification);
    }
}
