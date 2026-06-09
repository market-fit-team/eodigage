package com.example.server.infrastructure.messaging.scheduledpost;

import java.time.Instant;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.core.post.Post;
import com.example.server.core.post.PostCommandService;
import com.example.server.core.scheduledpost.ScheduledPost;
import com.example.server.core.scheduledpost.ScheduledPostFailureService;
import com.example.server.core.scheduledpost.event.ScheduledPostPublishedEvent;
import com.example.server.infrastructure.messaging.config.RabbitConfig;
import com.example.server.infrastructure.persistence.scheduledpost.ScheduledPostRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ScheduledPostPublishConsumer {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostCommandService postCommandService;
    private final ScheduledPostFailureService failureService;
    private final ApplicationEventPublisher eventPublisher;

    @RabbitListener(queues = RabbitConfig.SCHEDULED_POST_QUEUE)
    @Transactional
    public void handle(ScheduledPostPublishMessage message) {
        Instant now = Instant.now();

        int claimed = scheduledPostRepository.claimForPublishing(message.scheduledPostId(), now);
        if (claimed == 0) {
            return;
        }

        ScheduledPost scheduledPost = scheduledPostRepository.findById(message.scheduledPostId())
                .orElseThrow(() -> new IllegalStateException("scheduled post not found: " + message.scheduledPostId()));

        try {
            Post published;
            var draft = scheduledPost.toPostDraft();

            if (scheduledPost.getParent() == null) {
                published = postCommandService.createRootFromScheduled(
                        scheduledPost.getUser(),
                        draft
                );
            } else {
                Post parent = scheduledPost.getParent();

                published = postCommandService.createReplyFromScheduled(
                        scheduledPost.getUser(),
                        parent,
                        draft
                );
            }

            scheduledPost.markPublished(published);
            eventPublisher.publishEvent(ScheduledPostPublishedEvent.from(scheduledPost));
        } catch (Exception ex) {
            failureService.markFailed(message.scheduledPostId(), ex.getMessage());
            throw ex;
        }
    }
}
