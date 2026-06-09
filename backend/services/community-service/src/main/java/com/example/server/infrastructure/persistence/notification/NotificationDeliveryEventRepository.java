package com.example.server.infrastructure.persistence.notification;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.infrastructure.messaging.notification.NotificationDeliveryEvent;

public interface NotificationDeliveryEventRepository extends JpaRepository<NotificationDeliveryEvent, Long> {
    boolean existsByEventId(UUID eventId);
}
