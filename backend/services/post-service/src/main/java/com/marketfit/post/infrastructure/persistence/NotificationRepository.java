package com.marketfit.post.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marketfit.post.core.notification.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findTop30ByRecipientUserIdOrderByCreatedAtDescIdDesc(String recipientUserId);

    Optional<Notification> findByIdAndRecipientUserId(UUID id, String recipientUserId);
}
