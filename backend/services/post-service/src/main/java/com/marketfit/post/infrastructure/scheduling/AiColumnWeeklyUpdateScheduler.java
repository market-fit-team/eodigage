package com.marketfit.post.infrastructure.scheduling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.marketfit.post.api.post.dto.CrawlSummaryRequest;
import com.marketfit.post.application.report.PostCrawlSummaryFacade;
import com.marketfit.post.core.post.PostVisibility;
import com.marketfit.post.infrastructure.config.AiColumnUpdateProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiColumnWeeklyUpdateScheduler {

    private final PostCrawlSummaryFacade postCrawlSummaryFacade;
    private final AiColumnUpdateProperties properties;

    @Scheduled(cron = "${app.post.ai-column-update.cron}", zone = "${app.post.ai-column-update.zone}")
    public void updateWeeklyAiColumns() {
        if (!properties.enabled()) {
            log.debug("[PostScheduler] weekly AI column update is disabled.");
            return;
        }

        try {
            var creation = postCrawlSummaryFacade.createDetailed(
                    properties.actorId(),
                    new CrawlSummaryRequest(
                            null,
                            properties.keyword(),
                            null,
                            PostVisibility.PUBLIC
                    )
            );
            log.info(
                    "[PostScheduler] weekly AI column update completed. created={}, failed={}",
                    creation.createdCount(),
                    creation.failedCount()
            );
        } catch (RuntimeException exception) {
            log.warn(
                    "[PostScheduler] weekly AI column update failed. reason={}",
                    exception.getMessage(),
                    exception
            );
        }
    }
}
