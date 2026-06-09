package com.example.server.core.notification;

import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.core.notification.event.NotificationCreatedEvent;
import com.example.server.infrastructure.persistence.session.DbSessionContext;
import com.example.server.infrastructure.persistence.notification.NotificationRepository;
import com.example.server.core.post.Post;
import com.example.server.core.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationCommandService {

    private final NotificationRepository notificationRepository;
    private final DbSessionContext dbSessionContext;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Optional<Notification> createReplyNotification(Post parentPost, Post replyPost, User actor) {
        User recipient = parentPost.getUser();
        if (recipient.getId().equals(actor.getId())) {
            return Optional.empty();
        }

        dbSessionContext.setCurrentUserId(actor.getId());

        Notification notification = Notification.reply(recipient, actor, parentPost, replyPost);
        Notification saved = notificationRepository.saveAndFlush(notification);
        eventPublisher.publishEvent(NotificationCreatedEvent.from(saved));

        return Optional.of(saved);
    }

    @Transactional
    public Optional<Notification> createLikeNotification(Post targetPost, User actor) {
        User recipient = targetPost.getUser();
        if (recipient.getId().equals(actor.getId())) {
            return Optional.empty();
        }

        dbSessionContext.setCurrentUserId(actor.getId());

        Notification notification = Notification.like(recipient, actor, targetPost);
        Notification saved = notificationRepository.saveAndFlush(notification);
        eventPublisher.publishEvent(NotificationCreatedEvent.from(saved));

        return Optional.of(saved);
    }
}
