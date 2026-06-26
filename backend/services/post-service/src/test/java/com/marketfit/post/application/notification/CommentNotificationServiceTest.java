package com.marketfit.post.application.notification;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.marketfit.post.core.comment.PostComment;
import com.marketfit.post.core.notification.Notification;
import com.marketfit.post.infrastructure.persistence.NotificationRepository;

class CommentNotificationServiceTest {

    @Test
    void saves_one_notification_per_user_even_when_user_has_multiple_emitters() {
        NotificationRepository notificationRepository = org.mockito.Mockito.mock(NotificationRepository.class);
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CommentNotificationService service = new CommentNotificationService(notificationRepository);

        service.connect("user-1");
        service.connect("user-1");

        service.publishCommentCreated(comment());

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void saves_notifications_per_distinct_connected_user() {
        NotificationRepository notificationRepository = org.mockito.Mockito.mock(NotificationRepository.class);
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CommentNotificationService service = new CommentNotificationService(notificationRepository);

        service.connect("user-1");
        service.connect("user-1");
        service.connect("user-2");

        service.publishCommentCreated(comment());

        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    private PostComment comment() {
        return PostComment.create(
                UUID.randomUUID(),
                "comment-author",
                "Comment Author",
                "새 댓글입니다."
        );
    }
}
