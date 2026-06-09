package com.example.server.infrastructure.messaging.scheduledpost;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.server.infrastructure.messaging.config.RabbitConfig;
import com.example.server.infrastructure.persistence.scheduledpost.ScheduledPostRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ScheduledPostPublisherScheduler {

    private final ScheduledPostRepository scheduledPostRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelayString = "${app.scheduled-post.scan-delay:30000}")
    public void publishDueScheduledPosts() {
        Instant now = Instant.now();

        List<Long> dueIds = scheduledPostRepository.findDueIds(
                now,
                PageRequest.of(0, 100)
        );

        for (Long scheduledPostId : dueIds) {
            ScheduledPostPublishMessage message = new ScheduledPostPublishMessage(
                    UUID.randomUUID(),
                    scheduledPostId,
                    null,
                    now,
                    Instant.now()
            );

            rabbitTemplate.convertAndSend(
                    RabbitConfig.EVENTS_EXCHANGE,
                    RabbitConfig.RK_SCHEDULED_POST_PUBLISH,
                    message
            );
        }
    }
}
