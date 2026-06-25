package com.marketfit.post.application.llm;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.marketfit.post.application.report.LlmReportPerspective;
import com.marketfit.post.core.llm.LlmReportRequest;
import com.marketfit.post.core.llm.LlmSummaryResult;
import com.marketfit.post.core.llm.PostLlmProvider;
import com.marketfit.post.core.llm.PostLlmSummary;
import com.marketfit.post.infrastructure.config.PostLlmProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostLlmSummaryService {

    private static final int MAX_ERROR_MESSAGE_LENGTH = 1_000;

    private final PostLlmProvider provider;
    private final PostLlmSummaryStore summaryStore;
    private final PostLlmProperties properties;

    public SummaryExecution summarize(LlmReportRequest request) {
        return summarize(request, LlmReportPerspective.TREND);
    }

    public SummaryExecution summarize(
            LlmReportRequest request,
            LlmReportPerspective perspective
    ) {
        return summarize(request, perspective, "manual");
    }

    public SummaryExecution summarize(
            LlmReportRequest request,
            LlmReportPerspective perspective,
            String generationSeed
    ) {
        String prompt = buildPrompt(perspective, generationSeed);
        PostLlmSummary record = summaryStore.createRequested(
                properties.provider(),
                properties.model(),
                prompt
        );

        try {
            LlmSummaryResult result = provider.summarize(request, prompt);
            summaryStore.markSummarized(record.getId(), result);
            return new SummaryExecution(record.getId(), result);
        } catch (RuntimeException exception) {
            saveFailure(record.getId(), exception);
            throw exception;
        }
    }

    public void linkPost(SummaryExecution execution, UUID postId) {
        summaryStore.linkPost(execution.summaryId(), postId);
    }

    private String buildPrompt(LlmReportPerspective perspective, String generationSeed) {
        return """
                너는 뉴스 기반 창업 상권 AI 칼럼을 작성하는 전문가다.
                입력 기사에서 확인 가능한 내용만 근거로 사용하고, 없는 지표나 수치를 만들지 않는다.
                고정 템플릿 문장, 원문 덤프, 성공 보장 표현은 사용하지 않는다.

                category: %s
                generationSeed: %s
                titleGuide: %s
                categoryInstruction: %s
                contentSections:
                %s

                반드시 JSON 객체로만 title, summary, content를 반환한다.
                title은 LLM이 새로 생성하고, category와 generationSeed를 반영해 이전 실행과 같은 문구가 반복되지 않게 작성한다.
                title에 generationSeed 값을 그대로 노출하지 않는다.
                summary는 2~4문장으로 작성한다.
                content는 Markdown 형식의 500~900자 칼럼으로 작성하고, 위 contentSections의 섹션 제목만 사용한다.
                "[기사 1]", "제목:", "URL:", "본문:", "수집 본문:", "(직접 입력)" 같은 원문 디버그 문자열은 절대 포함하지 않는다.
                """.formatted(
                perspective.label(),
                generationSeed,
                perspective.titleGuide(),
                perspective.promptInstruction(),
                perspective.sectionOutline().trim()
        );
    }

    private void saveFailure(UUID id, RuntimeException exception) {
        try {
            summaryStore.markFailed(id, safeErrorMessage(exception));
        } catch (RuntimeException persistenceException) {
            exception.addSuppressed(persistenceException);
        }
    }

    private String safeErrorMessage(RuntimeException exception) {
        String message = exception instanceof ResponseStatusException responseException
                ? responseException.getReason()
                : exception.getMessage();
        String safeMessage = message == null || message.isBlank()
                ? "LLM 요약 처리에 실패했습니다."
                : message.trim();
        return safeMessage.length() <= MAX_ERROR_MESSAGE_LENGTH
                ? safeMessage
                : safeMessage.substring(0, MAX_ERROR_MESSAGE_LENGTH);
    }

    public record SummaryExecution(
            UUID summaryId,
            LlmSummaryResult result
    ) {
    }
}
