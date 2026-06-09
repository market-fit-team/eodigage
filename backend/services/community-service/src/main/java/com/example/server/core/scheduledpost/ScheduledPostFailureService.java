package com.example.server.core.scheduledpost;

import com.example.server.infrastructure.persistence.scheduledpost.ScheduledPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScheduledPostFailureService {

    private final ScheduledPostRepository scheduledPostRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long scheduledPostId, String reason) {
        ScheduledPost scheduledPost = scheduledPostRepository.findById(scheduledPostId)
                .orElseThrow();
        scheduledPost.markFailed(reason);
    }
}
