package com.example.server.core.notification;

import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.server.infrastructure.persistence.session.DbSessionContext;
import com.example.server.infrastructure.persistence.notification.NotificationRepository;
import com.example.server.core.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationReadCommandService {

    private final NotificationRepository notificationRepository;
    private final DbSessionContext dbSessionContext;

    @Transactional
    public void markAsRead(Long notificationId, User currentUser) {
        dbSessionContext.setCurrentUserId(currentUser.getId());

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "알림을 찾을 수 없습니다. id=" + notificationId
                ));

        notification.markAsRead();
    }

    @Transactional
    public void markAllAsRead(User currentUser) {
        dbSessionContext.setCurrentUserId(currentUser.getId());
        notificationRepository.markAllAsRead(currentUser.getId(), Instant.now());
    }

    @Transactional
    public void delete(Long notificationId, User currentUser) {
        dbSessionContext.setCurrentUserId(currentUser.getId());

        int deleted = notificationRepository.deleteByIdAndRecipientId(notificationId, currentUser.getId());
        if (deleted == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "알림을 찾을 수 없습니다. id=" + notificationId
            );
        }
    }
}
