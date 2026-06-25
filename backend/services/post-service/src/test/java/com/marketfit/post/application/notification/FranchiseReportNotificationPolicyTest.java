package com.marketfit.post.application.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.marketfit.post.core.llm.PostLlmSummaryStatus;
import com.marketfit.post.core.post.PostSourceType;
import com.marketfit.post.core.post.PostStatus;

class FranchiseReportNotificationPolicyTest {

    private final FranchiseReportNotificationPolicy policy =
            new FranchiseReportNotificationPolicy();

    @Test
    void 프랜차이즈_또는_가맹점_키워드는_알림_대상이다() {
        assertThat(eligible(List.of("프랜차이즈"))).isTrue();
        assertThat(eligible(List.of("가맹점"))).isTrue();
    }

    @Test
    void 상권과_임대료만_있으면_알림_대상이_아니다() {
        assertThat(eligible(List.of("상권", "임대료"))).isFalse();
    }

    @Test
    void 프랜차이즈_칼럼이면_크롤링_매칭점수가_낮아도_알림_대상이다() {
        assertThat(policy.isEligible(
                List.of("상권", "임대료"), 0, 0.0,
                PostSourceType.LLM_REPORT, PostStatus.PUBLISHED,
                PostLlmSummaryStatus.SUMMARIZED,
                true
        )).isTrue();
    }

    @Test
    void 관련도와_문단수나_LLM상태가_조건을_충족하지_못하면_제외된다() {
        assertThat(policy.isEligible(
                List.of("프랜차이즈"), 1, 0.19,
                PostSourceType.LLM_REPORT, PostStatus.PUBLISHED,
                PostLlmSummaryStatus.SUMMARIZED
        )).isFalse();
        assertThat(policy.isEligible(
                List.of("프랜차이즈"), 0, 0.8,
                PostSourceType.LLM_REPORT, PostStatus.PUBLISHED,
                PostLlmSummaryStatus.SUMMARIZED
        )).isFalse();
        assertThat(policy.isEligible(
                List.of("프랜차이즈"), 1, 0.8,
                PostSourceType.LLM_REPORT, PostStatus.PUBLISHED,
                PostLlmSummaryStatus.FAILED
        )).isFalse();
    }

    private boolean eligible(List<String> keywords) {
        return policy.isEligible(
                keywords, 1, 0.8,
                PostSourceType.LLM_REPORT, PostStatus.PUBLISHED,
                PostLlmSummaryStatus.SUMMARIZED
        );
    }
}
