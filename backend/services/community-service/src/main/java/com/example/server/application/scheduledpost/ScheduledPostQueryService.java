package com.example.server.application.scheduledpost;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.api.scheduledpost.dto.ScheduledPostResponse;
import com.example.server.core.user.User;
import com.example.server.infrastructure.persistence.scheduledpost.ScheduledPostRepository;
import com.example.server.infrastructure.persistence.session.DbSessionContext;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduledPostQueryService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final DbSessionContext dbSessionContext;

    public Page<ScheduledPostResponse> findMine(User currentUser, Pageable pageable) {
        dbSessionContext.setCurrentUserId(currentUser.getId());
        return scheduledPostRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable)
                .map(ScheduledPostResponse::from);
    }
}
