package com.marketfit.post.application.report;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.marketfit.post.api.post.dto.CrawlSummaryRequest;
import com.marketfit.post.application.crawling.PostCrawlService;
import com.marketfit.post.application.llm.PostLlmSummaryService;
import com.marketfit.post.application.notification.PostReportNotificationService;
import com.marketfit.post.application.notification.PostReportNotificationService.NotificationDecision;
import com.marketfit.post.application.notification.PublicPostReportEventService;
import com.marketfit.post.application.notification.ReportCategory;
import com.marketfit.post.application.post.PostService;
import com.marketfit.post.core.crawling.CrawledContent;
import com.marketfit.post.core.llm.LlmReportRequest;
import com.marketfit.post.core.llm.PostLlmSummaryStatus;
import com.marketfit.post.core.post.Post;
import com.marketfit.post.core.post.PostDraft;
import com.marketfit.post.core.post.PostSourceType;
import com.marketfit.post.core.post.PostVisibility;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PostCrawlSummaryFacade {

    private final PostCrawlService postCrawlService;
    private final PostLlmSummaryService postLlmSummaryService;
    private final PostService postService;
    private final PostReportNotificationService notificationService;
    private final PublicPostReportEventService publicEventService;
    private final Supplier<List<LlmReportPerspective>> perspectiveSelector;

    @Autowired
    public PostCrawlSummaryFacade(
            PostCrawlService postCrawlService,
            PostLlmSummaryService postLlmSummaryService,
            PostService postService,
            PostReportNotificationService notificationService,
            PublicPostReportEventService publicEventService
    ) {
        this(
                postCrawlService,
                postLlmSummaryService,
                postService,
                notificationService,
                publicEventService,
                () -> LlmReportPerspective.randomSelection(4)
        );
    }

    public PostCrawlSummaryFacade(
            PostCrawlService postCrawlService,
            PostLlmSummaryService postLlmSummaryService,
            PostService postService
    ) {
        this(postCrawlService, postLlmSummaryService, postService, null, null);
    }

    PostCrawlSummaryFacade(
            PostCrawlService postCrawlService,
            PostLlmSummaryService postLlmSummaryService,
            PostService postService,
            PostReportNotificationService notificationService,
            PublicPostReportEventService publicEventService,
            Supplier<List<LlmReportPerspective>> perspectiveSelector
    ) {
        this.postCrawlService = postCrawlService;
        this.postLlmSummaryService = postLlmSummaryService;
        this.postService = postService;
        this.notificationService = notificationService;
        this.publicEventService = publicEventService;
        this.perspectiveSelector = perspectiveSelector;
    }

    public Post create(String userId, CrawlSummaryRequest request) {
        return createDetailed(userId, request).post();
    }

    public CrawlSummaryCreation createDetailed(String userId, CrawlSummaryRequest request) {
        String actorId = userId.trim();
        PostVisibility visibility = request.visibility() == null
                ? PostVisibility.PUBLIC
                : request.visibility();
        CrawledContent crawledContent = postCrawlService.crawl(request);
        List<Post> posts = new ArrayList<>();
        List<CrawledContent> crawledContents = new ArrayList<>();
        List<PostLlmSummaryService.SummaryExecution> executions = new ArrayList<>();
        List<NotificationDecision> notifications = new ArrayList<>();
        List<Post> franchisePosts = new ArrayList<>();
        List<NotificationDecision> franchiseNotifications = new ArrayList<>();
        List<RuntimeException> failures = new ArrayList<>();
        String generationToken = UUID.randomUUID().toString().substring(0, 8);

        List<GenerationTask> generationTasks = prepareGenerationTasks(crawledContent, generationToken);
        List<CompletableFuture<PostLlmSummaryService.SummaryExecution>> summaryFutures = generationTasks.stream()
                .map(task -> CompletableFuture.supplyAsync(() -> postLlmSummaryService.summarize(
                        new LlmReportRequest(task.crawledContent().toLlmDocument(), task.perspective().category()),
                        task.perspective(),
                        task.generationSeed()
                )))
                .toList();

        for (int index = 0; index < generationTasks.size(); index++) {
            GenerationTask task = generationTasks.get(index);
            LlmReportPerspective perspective = task.perspective();
            CrawledContent postCrawledContent = task.crawledContent();
            try {
                PostLlmSummaryService.SummaryExecution execution = summaryFutures.get(index).join();
                Post post = createPost(actorId, postCrawledContent, execution, perspective, visibility);
                linkMetadata(postCrawledContent, execution, post);
                NotificationDecision notification = publishNotificationIfFranchise(
                        perspective,
                        post,
                        postCrawledContent,
                        actorId
                );
                posts.add(post);
                crawledContents.add(postCrawledContent);
                executions.add(execution);
                notifications.add(notification);
                if (perspective == LlmReportPerspective.FRANCHISE) {
                    franchisePosts.add(post);
                    franchiseNotifications.add(notification);
                }
            } catch (RuntimeException exception) {
                RuntimeException failure = unwrapCompletionException(exception);
                log.warn(
                        "[PostLLM] perspective generation failed. perspective={}, reason={}",
                        perspective.name(),
                        failure.getMessage(),
                        failure
                );
                failures.add(failure);
            }
        }

        publishFranchiseBatchEvent(franchisePosts, franchiseNotifications);

        if (posts.isEmpty()) {
            RuntimeException firstFailure = failures.isEmpty()
                    ? new IllegalStateException("AI 칼럼 생성에 실패했습니다.")
                    : failures.getFirst();
            if (firstFailure instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI 칼럼 생성에 모두 실패했습니다.",
                    firstFailure
            );
        }

        return new CrawlSummaryCreation(
                posts,
                crawledContents,
                executions,
                notifications,
                failures.size()
        );
    }

    private Post createPost(
            String userId,
            CrawledContent crawledContent,
            PostLlmSummaryService.SummaryExecution execution,
            LlmReportPerspective perspective,
            PostVisibility visibility
    ) {
        var result = execution.result();
        PostDraft draft = new PostDraft(
                result.title(),
                result.summary(),
                result.content(),
                perspective.category(),
                readTimeMinutes(result.content()),
                PostSourceType.LLM_REPORT,
                crawledContent.sourceUrl(),
                crawledContent.title(),
                crawledContent.crawledAt(),
                result.provider() + ":" + result.model()
        );

        try {
            return postService.createCrawlSummary(
                    userId,
                    draft,
                    crawledContent,
                    visibility
            );
        } catch (DataAccessException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "LLM 요약은 완료됐지만 Post 저장에 실패했습니다.",
                    exception
            );
        }
    }

    private List<GenerationTask> prepareGenerationTasks(
            CrawledContent crawledContent,
            String generationToken
    ) {
        List<GenerationTask> tasks = new ArrayList<>();
        List<LlmReportPerspective> perspectives = perspectiveSelector.get();
        for (int index = 0; index < perspectives.size(); index++) {
            LlmReportPerspective perspective = perspectives.get(index);
            CrawledContent postCrawledContent = index == 0
                    ? crawledContent
                    : postCrawlService.duplicateCrawled(crawledContent);
            tasks.add(new GenerationTask(
                    perspective,
                    postCrawledContent,
                    generationToken + "-" + perspective.name()
            ));
        }
        return tasks;
    }

    private RuntimeException unwrapCompletionException(RuntimeException exception) {
        if (exception instanceof CompletionException && exception.getCause() instanceof RuntimeException cause) {
            return cause;
        }
        return exception;
    }

    private void linkMetadata(
            CrawledContent crawledContent,
            PostLlmSummaryService.SummaryExecution execution,
            Post post
    ) {
        try {
            postCrawlService.linkPost(crawledContent, post.getId());
            postLlmSummaryService.linkPost(execution, post.getId());
        } catch (DataAccessException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Post 저장은 완료됐지만 생성 메타데이터 연결에 실패했습니다.",
                    exception
            );
        }
    }

    private NotificationDecision publishNotificationIfFranchise(
            LlmReportPerspective perspective,
            Post post,
            CrawledContent crawledContent,
            String userId
    ) {
        if (perspective != LlmReportPerspective.FRANCHISE) {
            return new NotificationDecision(false, null);
        }
        return notificationService == null
                ? new NotificationDecision(false, null)
                : notificationService.publishIfEligible(
                        post,
                        crawledContent,
                        userId,
                        PostLlmSummaryStatus.SUMMARIZED,
                        true
                );
    }

    private void publishFranchiseBatchEvent(
            List<Post> posts,
            List<NotificationDecision> notifications
    ) {
        if (publicEventService == null) {
            return;
        }
        boolean hasFranchise = notifications.stream()
                .anyMatch(notification -> notification.eligible()
                        && notification.category() == ReportCategory.FRANCHISE);
        if (hasFranchise) {
            publicEventService.publishFranchiseColumnBatch(posts);
        }
    }

    private int readTimeMinutes(String content) {
        return Math.max(1, Math.min(120, (int) Math.ceil(content.length() / 500.0)));
    }

    private record GenerationTask(
            LlmReportPerspective perspective,
            CrawledContent crawledContent,
            String generationSeed
    ) {
    }

    public record CrawlSummaryCreation(
            Post post,
            List<Post> posts,
            CrawledContent crawledContent,
            List<CrawledContent> crawledContents,
            PostLlmSummaryService.SummaryExecution llmExecution,
            List<PostLlmSummaryService.SummaryExecution> llmExecutions,
            NotificationDecision notification,
            List<NotificationDecision> notifications,
            int failedCount
    ) {
        public CrawlSummaryCreation(
                Post post,
                CrawledContent crawledContent,
                PostLlmSummaryService.SummaryExecution llmExecution,
                NotificationDecision notification
        ) {
            this(
                    post,
                    List.of(post),
                    crawledContent,
                    List.of(crawledContent),
                    llmExecution,
                    List.of(llmExecution),
                    notification,
                    List.of(notification),
                    0
            );
        }

        public CrawlSummaryCreation(
                List<Post> posts,
                List<CrawledContent> crawledContents,
                List<PostLlmSummaryService.SummaryExecution> llmExecutions,
                List<NotificationDecision> notifications,
                int failedCount
        ) {
            this(
                    posts.getFirst(),
                    List.copyOf(posts),
                    crawledContents.getFirst(),
                    List.copyOf(crawledContents),
                    llmExecutions.getFirst(),
                    List.copyOf(llmExecutions),
                    notifications.getFirst(),
                    List.copyOf(notifications),
                    failedCount
            );
        }

        public int createdCount() {
            return posts.size();
        }

        public String status() {
            return failedCount == 0 ? "SUMMARIZED" : "PARTIAL_SUMMARIZED";
        }
    }
}
