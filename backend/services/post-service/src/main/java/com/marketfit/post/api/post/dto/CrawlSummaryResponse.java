package com.marketfit.post.api.post.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.marketfit.post.application.notification.ReportCategory;
import com.marketfit.post.application.report.PostCrawlSummaryFacade.CrawlSummaryCreation;
import com.marketfit.post.core.crawling.InputUrlType;
import com.marketfit.post.core.llm.PostLlmSummaryStatus;
import com.marketfit.post.core.post.Post;
import com.marketfit.post.core.post.PostSourceType;

public record CrawlSummaryResponse(
        String status,
        UUID id,
        UUID postId,
        List<UUID> postIds,
        int createdCount,
        int failedCount,
        String title,
        String summary,
        String thumbnailUrl,
        PostSourceType sourceType,
        UUID sourceId,
        Instant createdAt,
        Debug debug
) {
    public static CrawlSummaryResponse from(CrawlSummaryCreation creation) {
        Post post = creation.post();
        var content = creation.crawledContent();
        var result = creation.llmExecution().result();
        boolean notificationEligible = creation.notifications().stream()
                .anyMatch(notification -> notification.eligible()
                        && notification.category() == ReportCategory.FRANCHISE);
        return new CrawlSummaryResponse(
                creation.status(),
                post.getId(),
                post.getId(),
                creation.posts().stream().map(Post::getId).toList(),
                creation.createdCount(),
                creation.failedCount(),
                post.getTitle(),
                post.getSummary(),
                post.getThumbnailUrl(),
                post.getSourceType(),
                post.getSourceId(),
                post.getCreatedAt(),
                new Debug(
                        result.provider(),
                        result.model(),
                        content.inputUrlType(),
                        content.crawledArticleCount(),
                        content.skippedArticleCount(),
                        content.bodyText().length(),
                        content.matchedKeywords(),
                        content.matchedParagraphCount(),
                        content.relevanceScore(),
                        PostLlmSummaryStatus.SUMMARIZED,
                        notificationEligible,
                        notificationEligible ? ReportCategory.FRANCHISE : null
                )
        );
    }

    public record Debug(
            String llmProvider,
            String llmModel,
            InputUrlType inputUrlType,
            int crawledArticleCount,
            int skippedArticleCount,
            int crawledTextLength,
            List<String> matchedKeywords,
            int matchedParagraphCount,
            double relevanceScore,
            PostLlmSummaryStatus llmStatus,
            boolean notificationEligible,
            ReportCategory notificationCategory
    ) {
    }
}
