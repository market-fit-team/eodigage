package com.example.server.application.scheduledpost;

import com.example.server.core.scheduledpost.event.ScheduledPostPublishedEvent;
import com.example.server.application.notification.NotificationSseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ScheduledPostPublishedEventListener {

    private final NotificationSseService notificationSseService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ScheduledPostPublishedEvent event) {
        ScheduledPostPublishedPayload payload = new ScheduledPostPublishedPayload(
                event.scheduledPostId(),
                event.publishedPostId(),
                event.content(),
                event.publishedAt()
        );
        notificationSseService.sendEventToUser(
                event.userId(),
                "scheduled-post.published",
                String.valueOf(event.scheduledPostId()),
                payload
        );
    }
}
