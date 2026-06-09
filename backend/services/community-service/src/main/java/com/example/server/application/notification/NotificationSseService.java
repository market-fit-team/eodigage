package com.example.server.application.notification;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.example.server.core.user.User;

@Service
public class NotificationSseService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSseService.class);
    private static final long TIMEOUT_MILLIS = Duration.ofHours(1).toMillis();

    private final Map<Long, Map<String, SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter connect(User currentUser) {
        Long userId = currentUser.getId();
        String emitterId = userId + ":" + UUID.randomUUID();

        SseEmitter emitter = new SseEmitter(TIMEOUT_MILLIS);
        emitters.computeIfAbsent(userId, ignored -> new ConcurrentHashMap<>())
                .put(emitterId, emitter);

        emitter.onCompletion(() -> remove(userId, emitterId));
        emitter.onTimeout(() -> remove(userId, emitterId));
        emitter.onError(error -> remove(userId, emitterId));

        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException | IllegalStateException ex) {
            remove(userId, emitterId);
        }

        return emitter;
    }

    public void sendEventToUser(Long userId, String eventName, String eventId, Object payload) {
        Map<String, SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) {
            return;
        }

        userEmitters.forEach((emitterId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .id(eventId)
                        .name(eventName)
                        .data(payload));
            } catch (IOException | IllegalStateException ex) {
                log.debug("Failed to send SSE. userId={}, emitterId={}", userId, emitterId, ex);
                remove(userId, emitterId);
            }
        });
    }

    public boolean sendEventIfConnected(Long userId, String eventName, String eventId, Object payload) {
        Map<String, SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) {
            return false;
        }

        boolean atLeastOneSent = false;

        for (Map.Entry<String, SseEmitter> entry : userEmitters.entrySet()) {
            String emitterId = entry.getKey();
            SseEmitter emitter = entry.getValue();
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .id(eventId)
                        .data(payload));
                atLeastOneSent = true;
            } catch (IOException | IllegalStateException ex) {
                remove(userId, emitterId);
            }
        }

        return atLeastOneSent;
    }

    @Scheduled(fixedDelay = 15_000)
    public void sendHeartbeat() {
        emitters.forEach((userId, userEmitters) -> {
            userEmitters.forEach((emitterId, emitter) -> {
                try {
                    emitter.send(SseEmitter.event().comment("thump"));
                } catch (IOException | IllegalStateException ex) {
                    remove(userId, emitterId);
                }
            });
        });
    }

    private void remove(Long userId, String emitterId) {
        Map<String, SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }

        userEmitters.remove(emitterId);
        if (userEmitters.isEmpty()) {
            emitters.remove(userId);
        }
    }
}
