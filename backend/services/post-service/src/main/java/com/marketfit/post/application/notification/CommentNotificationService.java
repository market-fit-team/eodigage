package com.marketfit.post.application.notification;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.marketfit.post.api.notification.dto.NotificationResponse;
import com.marketfit.post.core.comment.PostComment;
import com.marketfit.post.core.notification.Notification;
import com.marketfit.post.infrastructure.persistence.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentNotificationService {

    public static final String EVENT_NAME = "notification.created";
    private static final long TIMEOUT_MILLIS = Duration.ofHours(1).toMillis();

    private final NotificationRepository notificationRepository;
    private final Map<String, ConnectedUser> emitters = new ConcurrentHashMap<>();

    public SseEmitter connect(String userId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MILLIS);
        String emitterId = UUID.randomUUID().toString();
        emitters.put(emitterId, new ConnectedUser(userId, emitter));
        emitter.onCompletion(() -> emitters.remove(emitterId));
        emitter.onTimeout(() -> emitters.remove(emitterId));
        emitter.onError(error -> emitters.remove(emitterId));

        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException | IllegalStateException exception) {
            emitters.remove(emitterId);
        }

        return emitter;
    }

    @Transactional
    public void publishCommentCreated(PostComment comment) {
        Map<String, NotificationResponse> notificationByUserId = new ConcurrentHashMap<>();

        emitters.forEach((emitterId, connectedUser) -> {
            NotificationResponse notification = notificationByUserId.computeIfAbsent(
                    connectedUser.userId(),
                    userId -> NotificationResponse.from(notificationRepository.save(Notification.commentCreated(
                            userId,
                            comment.getPostId(),
                            comment.getId()
                    )))
            );
            send(emitterId, connectedUser.emitter(), notification);
        });
    }

    private void send(
            String emitterId,
            SseEmitter emitter,
            NotificationResponse event
    ) {
        try {
            emitter.send(SseEmitter.event()
                    .name(EVENT_NAME)
                    .data(event));
        } catch (IOException | IllegalStateException exception) {
            emitters.remove(emitterId);
        }
    }

    private record ConnectedUser(
            String userId,
            SseEmitter emitter
    ) {
    }
}
