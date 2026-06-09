package com.example.server.infrastructure.messaging.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notification_delivery_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationDeliveryEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private UUID eventId;

    @Column(name = "notification_id", nullable = false)
    private Long notificationId;

    @Column(name = "recipient_user_id", nullable = false)
    private Long recipientUserId;

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false, length = 40)
    private NotificationDeliveryStatus deliveryStatus;

    @Column(name = "failure_reason", columnDefinition = "text")
    private String failureReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public static NotificationDeliveryEvent create(UUID eventId, Long notificationId, Long recipientUserId, String eventType, NotificationDeliveryStatus deliveryStatus) {
        NotificationDeliveryEvent event = new NotificationDeliveryEvent();
        event.eventId = eventId;
        event.notificationId = notificationId;
        event.recipientUserId = recipientUserId;
        event.eventType = eventType;
        event.deliveryStatus = deliveryStatus;
        event.createdAt = Instant.now();
        return event;
    }
}
