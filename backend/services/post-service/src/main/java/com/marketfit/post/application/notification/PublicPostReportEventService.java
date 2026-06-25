package com.marketfit.post.application.notification;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.marketfit.post.core.post.Post;
import com.marketfit.post.core.post.PostSourceType;
import com.marketfit.post.core.post.PostStatus;
import com.marketfit.post.core.post.PostVisibility;

@Service
public class PublicPostReportEventService {

    public static final String EVENT_NAME = "post-report.created";
    private static final long TIMEOUT_MILLIS = Duration.ofHours(1).toMillis();

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter connect() {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MILLIS);
        register(UUID.randomUUID().toString(), emitter);
        return emitter;
    }

    public void publishIfPublicReport(Post post) {
        if (post.getSourceType() != PostSourceType.LLM_REPORT
                || post.getStatus() != PostStatus.PUBLISHED
                || post.getVisibility() != PostVisibility.PUBLIC) {
            return;
        }

        PublicPostReportEvent event = new PublicPostReportEvent(
                "NEW_AI_REPORT",
                "NEW_AI_REPORT",
                Instant.now(),
                post.getId(),
                post.getTitle(),
                post.getId(),
                post.getTitle(),
                post.getCategory().name(),
                post.getPublishedAt(),
                null,
                null,
                List.of(post.getId()),
                1
        );
        emitters.forEach((emitterId, emitter) -> send(emitterId, emitter, event));
    }

    public void publishFranchiseColumnBatch(List<Post> posts) {
        List<Post> publicReports = posts.stream()
                .filter(post -> post.getSourceType() == PostSourceType.LLM_REPORT)
                .filter(post -> post.getStatus() == PostStatus.PUBLISHED)
                .filter(post -> post.getVisibility() == PostVisibility.PUBLIC)
                .toList();
        if (publicReports.isEmpty()) {
            return;
        }

        Post representative = publicReports.getFirst();
        PublicPostReportEvent event = new PublicPostReportEvent(
                "NEW_FRANCHISE_AI_COLUMN",
                "NEW_FRANCHISE_AI_COLUMN",
                Instant.now(),
                representative.getId(),
                representative.getTitle(),
                representative.getId(),
                representative.getTitle(),
                representative.getCategory().name(),
                representative.getPublishedAt(),
                ReportCategory.FRANCHISE,
                "새 프랜차이즈 칼럼이 생성되었습니다: " + representative.getTitle(),
                publicReports.stream().map(Post::getId).toList(),
                publicReports.size()
        );
        emitters.forEach((emitterId, emitter) -> send(emitterId, emitter, event));
    }

    void register(String emitterId, SseEmitter emitter) {
        emitters.put(emitterId, emitter);
        emitter.onCompletion(() -> emitters.remove(emitterId));
        emitter.onTimeout(() -> emitters.remove(emitterId));
        emitter.onError(error -> emitters.remove(emitterId));

        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException | IllegalStateException exception) {
            emitters.remove(emitterId);
        }
    }

    private void send(
            String emitterId,
            SseEmitter emitter,
            PublicPostReportEvent event
    ) {
        try {
            emitter.send(SseEmitter.event()
                    .name(EVENT_NAME)
                    .data(event));
        } catch (IOException | IllegalStateException exception) {
            emitters.remove(emitterId);
        }
    }

    public record PublicPostReportEvent(
            String type,
            String eventType,
            Instant occurredAt,
            UUID postId,
            String title,
            UUID representativePostId,
            String representativeTitle,
            String category,
            Instant publishedAt,
            ReportCategory notificationCategory,
            String message,
            List<UUID> postIds,
            int createdCount
    ) {
    }
}
