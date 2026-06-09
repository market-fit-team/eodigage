package com.example.server.infrastructure.messaging.notification;

import com.example.server.core.notification.NotificationType;
import com.example.server.core.notification.event.NotificationCreatedEvent;
import com.example.server.infrastructure.messaging.config.RabbitConfig;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class NotificationRabbitPublisher {

    private final RabbitTemplate rabbitTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(NotificationCreatedEvent event) {
        NotificationDeliveryPayload payload = new NotificationDeliveryPayload(
                event.notificationId(),
                event.type(),
                event.actorId(),
                event.actorName(),
                event.actorPictureUrl(),
                event.targetPostId(),
                event.sourcePostId(),
                event.createdAt()
        );
        NotificationDeliveryMessage message = new NotificationDeliveryMessage(
                UUID.randomUUID(),
                toRoutingKey(event.type()),
                event.recipientUserId(),
                payload,
                Instant.now()
        );

        rabbitTemplate.convertAndSend(
                RabbitConfig.EVENTS_EXCHANGE,
                message.eventType(),
                message
        );
    }

    private String toRoutingKey(NotificationType type) {
        return switch (type) {
            case POST_REPLY -> RabbitConfig.RK_NOTIFICATION_COMMENT_CREATED;
            case POST_LIKE -> RabbitConfig.RK_NOTIFICATION_LIKE_CREATED;
        };
    }
}
