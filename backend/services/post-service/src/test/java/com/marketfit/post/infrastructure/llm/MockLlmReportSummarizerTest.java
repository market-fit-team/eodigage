package com.marketfit.post.infrastructure.llm;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Arrays;

import org.junit.jupiter.api.Test;

import com.marketfit.post.application.report.LlmReportPerspective;
import com.marketfit.post.core.crawling.CrawledDocument;
import com.marketfit.post.core.llm.LlmReportRequest;
import com.marketfit.post.core.post.PostCategory;

class MockLlmReportSummarizerTest {

    private final MockLlmReportSummarizer summarizer = new MockLlmReportSummarizer();

    @Test
    void createsDifferentTitleSummaryAndContentForSevenPerspectives() {
        var results = Arrays.stream(LlmReportPerspective.values())
                .map(perspective -> summarizer.summarize(new LlmReportRequest(
                        document(),
                        perspective.category()
                ), prompt(perspective)))
                .toList();

        assertThat(results).hasSize(7);
        assertThat(results).extracting(result -> result.title()).doesNotHaveDuplicates();
        assertThat(results).extracting(result -> result.summary()).doesNotHaveDuplicates();
        assertThat(results).extracting(result -> result.content()).doesNotHaveDuplicates();
        assertThat(results.get(0).content()).contains("## 시장 변화", "## 소비 패턴", "## 업계 흐름");
        assertThat(results.get(1).content()).contains("## 입지 조건", "## 유동인구와 주변 업종", "## 매출 가능성");
        assertThat(results.get(2).content()).contains("## 초기 비용", "## 운영 전략", "## 실행 우선순위");
        assertThat(results.get(3).content()).contains("## 브랜드 확장", "## 가맹점 관점", "## 창업 아이템");
        assertThat(results.get(4).content()).contains("## 고객층", "## 방문 패턴", "## 소비 니즈");
        assertThat(results.get(5).content()).contains("## 객단가", "## 회전율과 재방문", "## 수익성 개선");
        assertThat(results.get(6).content()).contains("## 폐업 위험", "## 경쟁 과밀과 임대료", "## 운영 리스크");
        assertThat(results)
                .allSatisfy(result -> assertThat(result.content())
                        .doesNotContain("[기사 1]", "URL: 직접 입력", "본문:"));
    }

    @Test
    void returnsProviderAndModel() {
        var result = summarizer.summarize(new LlmReportRequest(
                document(),
                PostCategory.POLICY
        ), prompt(LlmReportPerspective.FRANCHISE));

        assertThat(result.provider()).isEqualTo("MOCK");
        assertThat(result.model()).isEqualTo("mock-v1");
    }

    @Test
    void fallsBackToTrendWhenPromptHasNoCategory() {
        var result = summarizer.summarize(new LlmReportRequest(document(), null), "prompt");

        assertThat(result.summary()).hasSizeGreaterThan(30);
        assertThat(result.title()).contains("소비");
    }

    private CrawledDocument document() {
        return new CrawledDocument(
                "https://example.com",
                "프랜차이즈 창업",
                "수집된 기사 설명",
                """
                [기사 1]
                제목: 프랜차이즈 창업 기사
                URL: 직접 입력
                본문:
                프랜차이즈 창업 시장과 상권 변화, 배달 수수료, 인건비 부담을 설명하는 원문입니다.
                """,
                Instant.now()
        );
    }

    private String prompt(LlmReportPerspective perspective) {
        return "category: " + perspective.label();
    }
}
