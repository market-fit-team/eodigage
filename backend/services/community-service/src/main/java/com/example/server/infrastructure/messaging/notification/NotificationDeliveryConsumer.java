package com.example.server.infrastructure.messaging.notification;

import com.example.server.application.notification.NotificationSseService;
import com.example.server.infrastructure.messaging.config.RabbitConfig;
import com.example.server.infrastructure.persistence.notification.NotificationDeliveryEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class NotificationDeliveryConsumer {

    private final NotificationDeliveryEventRepository deliveryEventRepository;
    private final NotificationSseService notificationSseService;

    @RabbitListener(queues = RabbitConfig.NOTIFICATION_DELIVERY_QUEUE)
    @Transactional
    public void handle(NotificationDeliveryMessage message) {
        if (deliveryEventRepository.existsByEventId(message.eventId())) {
            return;
        }

        boolean sent = notificationSseService.sendEventIfConnected(
                message.recipientUserId(),
                "notification.created",
                String.valueOf(message.payload().id()),
                message.payload()
        );

        NotificationDeliveryStatus status = sent
                ? NotificationDeliveryStatus.SSE_SENT
                : NotificationDeliveryStatus.STORED_ONLY;

        deliveryEventRepository.save(NotificationDeliveryEvent.create(
                message.eventId(),
                message.payload().id(),
                message.recipientUserId(),
                message.eventType(),
                status
        ));
    }
}
