package com.marketfit.post.application.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.marketfit.post.api.post.dto.CrawlSummaryRequest;
import com.marketfit.post.application.crawling.PostCrawlService;
import com.marketfit.post.application.llm.PostLlmSummaryService;
import com.marketfit.post.application.notification.PostReportNotificationService;
import com.marketfit.post.application.notification.PostReportNotificationService.NotificationDecision;
import com.marketfit.post.application.notification.ReportCategory;
import com.marketfit.post.application.post.PostService;
import com.marketfit.post.core.crawling.CrawledContent;
import com.marketfit.post.core.llm.LlmSummaryResult;
import com.marketfit.post.core.post.Post;
import com.marketfit.post.core.post.PostCategory;
import com.marketfit.post.core.post.PostDraft;
import com.marketfit.post.core.post.PostSourceType;
import com.marketfit.post.core.post.PostVisibility;

class PostCrawlSummaryFacadeTest {

    @Test
    void URL_요청은_PostCrawlService에_위임하고_LLM_Provider는_서비스_경계에서_대체된다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                "https://example.com/article",
                "AI 채용",
                null,
                PostVisibility.PUBLIC
        );
        CrawledContent crawled = crawledContent();
        LlmSummaryResult result = new LlmSummaryResult(
                "제목",
                "요약",
                "본문",
                "OPENAI",
                "gpt-4o-mini",
                Map.of()
        );
        PostLlmSummaryService.SummaryExecution execution =
                new PostLlmSummaryService.SummaryExecution(UUID.randomUUID(), result);
        Post saved = Post.create(
                "user-1",
                "user-1",
                new PostDraft(
                        result.title(),
                        result.summary(),
                        result.content(),
                        PostCategory.TREND,
                        1,
                        PostSourceType.LLM_REPORT,
                        crawled.sourceUrl(),
                        crawled.title(),
                        crawled.crawledAt(),
                        "OPENAI:gpt-4o-mini"
                )
        );
        saved.configureCrawlSource(crawled.sourceId(), PostVisibility.PUBLIC);
        when(crawlService.crawl(request)).thenReturn(crawled);
        when(crawlService.duplicateCrawled(crawled)).thenReturn(crawled);
        when(summaryService.summarize(any(), any(), any())).thenReturn(execution);
        when(postService.createCrawlSummary(any(), any(), any(), any())).thenReturn(saved);

        facade.create("user-1", request);

        verify(crawlService).crawl(eq(request));
        verify(summaryService, times(4)).summarize(any(), any(), any());
    }

    @Test
    void 크롤링_LLM_Post저장_메타데이터_연결을_순서대로_조합한다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                "https://example.com",
                "AI 채용",
                null,
                null
        );
        CrawledContent crawled = crawledContent();
        LlmSummaryResult result = new LlmSummaryResult(
                "AI 채용 트렌드 요약 리포트",
                "최근 AI 채용 수요가 증가하고 있습니다.",
                "# AI 채용 트렌드\n\n## 핵심 요약\n- 증가",
                "OPENAI",
                "gpt-4o-mini",
                Map.of("totalTokens", 120)
        );
        var execution = new PostLlmSummaryService.SummaryExecution(UUID.randomUUID(), result);
        Post saved = Post.create(
                "user-1",
                "user-1",
                new PostDraft(
                        result.title(),
                        result.summary(),
                        result.content(),
                        PostCategory.TREND,
                        2,
                        PostSourceType.LLM_REPORT,
                        crawled.sourceUrl(),
                        crawled.title(),
                        crawled.crawledAt(),
                        "OPENAI:gpt-4o-mini"
                )
        );
        saved.configureCrawlSource(crawled.sourceId(), PostVisibility.PUBLIC);
        when(crawlService.crawl(request)).thenReturn(crawled);
        when(crawlService.duplicateCrawled(crawled)).thenReturn(crawled);
        when(summaryService.summarize(any(), any(), any())).thenReturn(execution);
        when(postService.createCrawlSummary(
                any(),
                any(),
                any(),
                any()
        )).thenReturn(saved);

        Post post = facade.create(" user-1 ", request);

        assertThat(post.getVisibility()).isEqualTo(PostVisibility.PUBLIC);
        assertThat(post.getSourceType()).isEqualTo(PostSourceType.LLM_REPORT);
        assertThat(post.getSourceId()).isEqualTo(crawled.sourceId());
        verify(crawlService, times(4)).linkPost(crawled, saved.getId());
        verify(summaryService, times(4)).linkPost(execution, saved.getId());
    }

    @Test
    void Post_DB_저장_실패는_LLM_실패와_구분된_500을_반환한다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                null,
                null,
                "원문",
                PostVisibility.PUBLIC
        );
        CrawledContent crawled = crawledContent();
        when(crawlService.crawl(request)).thenReturn(crawled);
        when(crawlService.duplicateCrawled(crawled)).thenReturn(crawled);
        when(summaryService.summarize(any(), any(), any())).thenReturn(
                new PostLlmSummaryService.SummaryExecution(
                        UUID.randomUUID(),
                        new LlmSummaryResult(
                                "제목",
                                "요약",
                                "본문",
                                "OPENAI",
                                "gpt-4o-mini",
                                Map.of()
                        )
                )
        );
        when(postService.createCrawlSummary(any(), any(), any(), any()))
                .thenThrow(new DataIntegrityViolationException("db failure"));

        assertThatThrownBy(() -> facade.create("user-1", request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> {
                    ResponseStatusException response = (ResponseStatusException) exception;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
                    assertThat(response.getReason()).contains("Post 저장에 실패");
                });
    }

    @Test
    void crawl_summary_요청_한번으로_관점별_Post_4개를_생성한다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostReportNotificationService notificationService = org.mockito.Mockito.mock(PostReportNotificationService.class);
        var publicEventService = org.mockito.Mockito.mock(
                com.marketfit.post.application.notification.PublicPostReportEventService.class
        );
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService,
                notificationService,
                publicEventService,
                () -> List.of(
                        LlmReportPerspective.TREND,
                        LlmReportPerspective.COMMERCIAL_DISTRICT,
                        LlmReportPerspective.STARTUP,
                        LlmReportPerspective.FRANCHISE
                )
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                "https://example.com",
                "AI 채용",
                null,
                PostVisibility.PUBLIC
        );
        CrawledContent crawled1 = crawledContent();
        CrawledContent crawled2 = crawledContent();
        CrawledContent crawled3 = crawledContent();
        CrawledContent crawled4 = crawledContent();
        when(crawlService.crawl(request)).thenReturn(crawled1);
        when(crawlService.duplicateCrawled(crawled1)).thenReturn(crawled2, crawled3, crawled4);
        var execution1 = execution("트렌드 리포트");
        var execution2 = execution("창업 기회 리포트");
        var execution3 = execution("리스크 리포트");
        var execution4 = execution("체크리스트 리포트");
        when(summaryService.summarize(any(), any(), any()))
                .thenReturn(execution1, execution2, execution3, execution4);
        Post post1 = post("트렌드 분석: 트렌드 리포트", crawled1, PostVisibility.PUBLIC, PostCategory.TREND);
        Post post2 = post("창업 기회: 창업 기회 리포트", crawled2, PostVisibility.PUBLIC, PostCategory.GUIDE);
        Post post3 = post("리스크 주의사항: 리스크 리포트", crawled3, PostVisibility.PUBLIC, PostCategory.POLICY);
        Post post4 = post("실행 체크리스트: 체크리스트 리포트", crawled4, PostVisibility.PUBLIC, PostCategory.GUIDE);
        when(postService.createCrawlSummary(any(), any(), any(), any()))
                .thenReturn(post1, post2, post3, post4);
        when(notificationService.publishIfEligible(any(), any(), any(), any(), anyBoolean()))
                .thenReturn(new NotificationDecision(true, ReportCategory.FRANCHISE));

        var creation = facade.createDetailed("user-1", request);

        assertThat(creation.posts()).hasSize(4);
        assertThat(creation.createdCount()).isEqualTo(4);
        assertThat(creation.failedCount()).isZero();
        assertThat(creation.status()).isEqualTo("SUMMARIZED");
        assertThat(creation.posts())
                .allSatisfy(post -> {
                    assertThat(post.getSourceType()).isEqualTo(PostSourceType.LLM_REPORT);
                    assertThat(post.getStatus().name()).isEqualTo("PUBLISHED");
                    assertThat(post.getVisibility()).isEqualTo(PostVisibility.PUBLIC);
                    assertThat(post.getDeletedAt()).isNull();
        });
        verify(summaryService, times(4)).summarize(any(), any(), any());
        verify(postService, times(4)).createCrawlSummary(any(), any(), any(), any());
        verify(publicEventService, times(1)).publishFranchiseColumnBatch(any());
    }

    @Test
    void 같은_요청을_다시_생성해도_제목_생성_토큰이_달라진다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                "https://example.com",
                "프랜차이즈 창업",
                null,
                PostVisibility.PUBLIC
        );
        CrawledContent crawled = crawledContent();
        when(crawlService.crawl(request)).thenReturn(crawled);
        when(crawlService.duplicateCrawled(crawled)).thenReturn(crawled);
        when(summaryService.summarize(any(), any(), any())).thenReturn(execution("프랜차이즈 시장 흐름"));
        when(postService.createCrawlSummary(any(), any(), any(), any()))
                .thenReturn(post("saved", crawled, PostVisibility.PUBLIC, PostCategory.TREND));

        facade.createDetailed("user-1", request);
        facade.createDetailed("user-1", request);

        ArgumentCaptor<String> seedCaptor = ArgumentCaptor.forClass(String.class);
        verify(summaryService, times(8)).summarize(any(), any(), seedCaptor.capture());
        List<String> seeds = seedCaptor.getAllValues().stream()
                .toList();
        assertThat(seeds).allMatch(seed -> seed.matches("[0-9a-f]{8}-.+"));
        String firstRunToken = seeds.getFirst().split("-")[0];
        String secondRunToken = seeds.get(4).split("-")[0];
        assertThat(secondRunToken).isNotEqualTo(firstRunToken);
    }

    @Test
    void 프랜차이즈_알림_대상이_아니면_SSE_batch_이벤트를_발행하지_않는다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostReportNotificationService notificationService = org.mockito.Mockito.mock(PostReportNotificationService.class);
        var publicEventService = org.mockito.Mockito.mock(
                com.marketfit.post.application.notification.PublicPostReportEventService.class
        );
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService,
                notificationService,
                publicEventService
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                "https://example.com",
                "상가",
                null,
                PostVisibility.PUBLIC
        );
        CrawledContent crawled = crawledContent();
        when(crawlService.crawl(request)).thenReturn(crawled);
        when(crawlService.duplicateCrawled(crawled)).thenReturn(crawled);
        when(summaryService.summarize(any(), any(), any())).thenReturn(execution("일반 칼럼"));
        when(postService.createCrawlSummary(any(), any(), any(), any()))
                .thenReturn(post("일반 칼럼", crawled, PostVisibility.PUBLIC, PostCategory.TREND));
        when(notificationService.publishIfEligible(any(), any(), any(), any(), anyBoolean()))
                .thenReturn(new NotificationDecision(false, null));

        facade.createDetailed("user-1", request);

        verify(publicEventService, times(0)).publishFranchiseColumnBatch(any());
    }

    @Test
    void 일부_LLM_호출이_실패하면_성공한_Post만_저장하고_PARTIAL_SUMMARIZED가_된다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                "https://example.com",
                "AI 채용",
                null,
                PostVisibility.PUBLIC
        );
        CrawledContent crawled1 = crawledContent();
        CrawledContent crawled2 = crawledContent();
        CrawledContent crawled3 = crawledContent();
        CrawledContent crawled4 = crawledContent();
        when(crawlService.crawl(request)).thenReturn(crawled1);
        when(crawlService.duplicateCrawled(crawled1)).thenReturn(crawled2, crawled3, crawled4);
        var execution = execution("성공 리포트");
        when(summaryService.summarize(any(), any(), any()))
                .thenReturn(execution)
                .thenThrow(new RuntimeException("llm failure"))
                .thenThrow(new RuntimeException("llm failure"))
                .thenThrow(new RuntimeException("llm failure"));
        Post saved = post("트렌드 분석: 성공 리포트", crawled1, PostVisibility.PUBLIC, PostCategory.TREND);
        when(postService.createCrawlSummary(any(), any(), any(), any())).thenReturn(saved);

        var creation = facade.createDetailed("user-1", request);

        assertThat(creation.posts()).containsExactly(saved);
        assertThat(creation.status()).isEqualTo("PARTIAL_SUMMARIZED");
        assertThat(creation.createdCount()).isEqualTo(1);
        assertThat(creation.failedCount()).isEqualTo(3);
        verify(postService, times(1)).createCrawlSummary(any(), any(), any(), any());
    }

    @Test
    void 모든_LLM_호출이_실패하면_성공_응답을_주지_않는다() {
        PostCrawlService crawlService = org.mockito.Mockito.mock(PostCrawlService.class);
        PostLlmSummaryService summaryService = org.mockito.Mockito.mock(PostLlmSummaryService.class);
        PostService postService = org.mockito.Mockito.mock(PostService.class);
        PostCrawlSummaryFacade facade = new PostCrawlSummaryFacade(
                crawlService,
                summaryService,
                postService
        );
        CrawlSummaryRequest request = new CrawlSummaryRequest(
                "https://example.com",
                "AI 채용",
                null,
                PostVisibility.PUBLIC
        );
        CrawledContent crawled1 = crawledContent();
        when(crawlService.crawl(request)).thenReturn(crawled1);
        when(crawlService.duplicateCrawled(crawled1))
                .thenReturn(crawledContent(), crawledContent(), crawledContent());
        when(summaryService.summarize(any(), any(), any()))
                .thenThrow(new RuntimeException("llm failure"));

        assertThatThrownBy(() -> facade.createDetailed("user-1", request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> {
                    ResponseStatusException response = (ResponseStatusException) exception;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(response.getReason()).contains("모두 실패");
                });
    }

    private CrawledContent crawledContent() {
        return new CrawledContent(
                UUID.randomUUID(),
                "https://example.com",
                "AI 채용",
                "기사 제목",
                "기사 설명",
                "기사 본문",
                Instant.parse("2026-06-21T01:00:00Z")
        );
    }

    private PostLlmSummaryService.SummaryExecution execution(String title) {
        return new PostLlmSummaryService.SummaryExecution(
                UUID.randomUUID(),
                new LlmSummaryResult(
                        title,
                        "상권 변화와 창업 가능성을 설명합니다. 운영 리스크도 함께 검토해야 합니다.",
                        "# " + title + "\n\n본문",
                        "OPENAI",
                        "gpt-4o-mini",
                        Map.of()
                )
        );
    }

    private Post post(
            String title,
            CrawledContent crawled,
            PostVisibility visibility,
            PostCategory category
    ) {
        Post post = Post.create(
                "user-1",
                "user-1",
                new PostDraft(
                        title,
                        "상권 변화와 창업 가능성을 설명합니다. 운영 리스크도 함께 검토해야 합니다.",
                        "# " + title + "\n\n본문",
                        category,
                        2,
                        PostSourceType.LLM_REPORT,
                        crawled.sourceUrl(),
                        crawled.title(),
                        crawled.crawledAt(),
                        "OPENAI:gpt-4o-mini"
                )
        );
        post.configureCrawlSource(crawled.sourceId(), visibility);
        return post;
    }
}
