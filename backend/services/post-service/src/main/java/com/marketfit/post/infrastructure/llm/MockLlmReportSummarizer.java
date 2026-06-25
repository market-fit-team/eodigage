package com.marketfit.post.infrastructure.llm;

import com.marketfit.post.application.report.LlmReportPerspective;
import com.marketfit.post.core.llm.LlmReportRequest;
import com.marketfit.post.core.llm.LlmSummaryResult;
import com.marketfit.post.core.llm.PostLlmProvider;

public class MockLlmReportSummarizer implements PostLlmProvider {

    private static final int TITLE_LIMIT = 60;
    private static final int EVIDENCE_LIMIT = 240;

    @Override
    public LlmSummaryResult summarize(LlmReportRequest request, String prompt) {
        String evidence = sanitize(request.document().rawContent());
        LlmReportPerspective perspective = perspectiveFromPrompt(prompt);
        String sourceTitle = hasText(request.document().title())
                ? request.document().title().trim()
                : "수집 뉴스";

        return new LlmSummaryResult(
                limit(titleFor(perspective), TITLE_LIMIT),
                summaryFor(perspective, sourceTitle),
                contentFor(perspective, sourceTitle, evidence),
                "MOCK",
                "mock-v1",
                java.util.Map.of()
        );
    }

    private LlmReportPerspective perspectiveFromPrompt(String prompt) {
        for (LlmReportPerspective perspective : LlmReportPerspective.values()) {
            if (prompt != null && prompt.contains("category: " + perspective.label())) {
                return perspective;
            }
        }
        return LlmReportPerspective.TREND;
    }

    private String titleFor(LlmReportPerspective perspective) {
        return switch (perspective) {
            case TREND -> "소비 변화로 읽는 창업 시장 흐름";
            case COMMERCIAL_DISTRICT -> "입지와 유동인구로 보는 상권 가능성";
            case STARTUP -> "예비창업자를 위한 초기 운영 전략";
            case FRANCHISE -> "프랜차이즈 시장성과 가맹 전략 점검";
            case CONSUMER_ANALYSIS -> "고객층과 방문 패턴으로 보는 소비자 니즈";
            case REVENUE_STRATEGY -> "객단가와 재방문을 높이는 매출 전략";
            case RISK_ANALYSIS -> "경쟁 과밀과 임대료 리스크 점검";
        };
    }

    private String summaryFor(LlmReportPerspective perspective, String sourceTitle) {
        return switch (perspective) {
            case TREND -> "%s 흐름은 소비 패턴과 업계 변화가 창업 판단에 직접 연결된다는 점을 보여준다. 단기 유행보다 반복 수요와 구매 빈도를 함께 봐야 한다.".formatted(sourceTitle);
            case COMMERCIAL_DISTRICT -> "%s 이슈는 입지, 주변 업종, 시간대별 유동인구를 함께 평가해야 한다는 신호다. 매출 가능성은 통행량보다 방문 목적에서 갈린다.".formatted(sourceTitle);
            case STARTUP -> "%s 흐름은 초기 비용과 운영 전략을 숫자로 쪼개야 한다는 점을 시사한다. 예비창업자는 투자 규모보다 손익분기와 인력 운영 가능성을 먼저 확인해야 한다.".formatted(sourceTitle);
            case FRANCHISE -> "%s 흐름은 브랜드 확장성과 가맹점 운영 조건을 분리해 봐야 한다는 점을 보여준다. 프랜차이즈 창업은 아이템 매력과 본사 지원 범위를 함께 판단해야 한다.".formatted(sourceTitle);
            case CONSUMER_ANALYSIS -> "%s 흐름은 고객층과 방문 패턴을 세밀하게 읽어야 한다는 점을 드러낸다. 연령대, 이용 시간, 니즈가 맞아야 재방문으로 이어진다.".formatted(sourceTitle);
            case REVENUE_STRATEGY -> "%s 흐름은 객단가, 회전율, 재방문 설계를 함께 조정해야 수익성이 개선된다는 점을 보여준다. 매출 전략은 메뉴보다 운영 동선에서 시작된다.".formatted(sourceTitle);
            case RISK_ANALYSIS -> "%s 흐름은 폐업 위험, 경쟁 과밀, 임대료 부담을 사전에 점검해야 한다는 경고다. 리스크 분석은 낙관적 매출보다 버틸 수 있는 비용 구조에서 출발해야 한다.".formatted(sourceTitle);
        };
    }

    private String contentFor(
            LlmReportPerspective perspective,
            String sourceTitle,
            String evidence
    ) {
        return switch (perspective) {
            case TREND -> """
                    ## 시장 변화
                    %s 흐름은 창업 시장이 단일 인기 업종보다 소비자의 생활 동선과 반복 구매 패턴에 민감하게 움직이고 있음을 보여준다.

                    ## 소비 패턴
                    고객은 가격, 대기 시간, 접근성에 빠르게 반응한다. 예비창업자는 메뉴나 서비스 자체보다 고객이 언제, 왜 방문하는지를 먼저 확인해야 한다.

                    ## 업계 흐름
                    근거 키워드: %s. 최근 변화가 일시적 유행인지, 상권과 비용 구조 안에서 반복될 수 있는 수요인지 구분하는 것이 중요하다.
                    """.formatted(sourceTitle, evidence).trim();
            case COMMERCIAL_DISTRICT -> """
                    ## 입지 조건
                    %s 흐름을 상권 관점에서 보면 좋은 입지는 통행량이 많은 곳이 아니라 구매 목적이 분명한 고객이 모이는 곳이다.

                    ## 유동인구와 주변 업종
                    주변 업종은 경쟁자인 동시에 수요를 만드는 장치가 될 수 있다. 출근, 점심, 저녁, 주말 수요가 어떻게 다른지 나눠 봐야 한다.

                    ## 매출 가능성
                    근거 키워드: %s. 예상 매출은 유동인구 총량보다 객단가, 체류 시간, 재방문 가능성을 함께 넣어 계산해야 한다.
                    """.formatted(sourceTitle, evidence).trim();
            case STARTUP -> """
                    ## 초기 비용
                    %s 흐름은 예비창업자가 보증금, 인테리어, 인건비, 수수료를 한 번에 보지 말고 고정비와 변동비로 나눠야 함을 보여준다.

                    ## 운영 전략
                    매출이 늘어도 인력과 재료비가 같이 오르면 수익성은 낮아질 수 있다. 작은 매장일수록 메뉴 수와 운영 동선을 단순하게 설계해야 한다.

                    ## 실행 우선순위
                    근거 키워드: %s. 창업 전에는 아이템 선호도보다 손익분기, 운영 인력, 반복 수요를 먼저 검증하는 편이 현실적이다.
                    """.formatted(sourceTitle, evidence).trim();
            case FRANCHISE -> """
                    ## 브랜드 확장
                    %s 흐름은 프랜차이즈 시장에서 브랜드 인지도만큼 실제 가맹점 운영 지원이 중요하다는 점을 보여준다.

                    ## 가맹점 관점
                    예비 가맹점주는 교육, 물류, 광고비, 필수 구매 조건을 분리해 검토해야 한다. 본사 지원이 강점인지 비용 부담인지 판단해야 한다.

                    ## 창업 아이템
                    근거 키워드: %s. 창업 아이템은 확장성보다 상권 적합성과 재방문 구조가 먼저 확인되어야 한다.
                    """.formatted(sourceTitle, evidence).trim();
            case CONSUMER_ANALYSIS -> """
                    ## 고객층
                    %s 흐름은 고객층을 넓게 잡기보다 실제 결제 가능성이 높은 연령대와 이용 목적을 좁혀야 함을 보여준다.

                    ## 방문 패턴
                    방문 시간대와 동반 형태가 다르면 필요한 메뉴, 좌석, 대기 방식도 달라진다. 소비자 분석은 매장 설계의 출발점이다.

                    ## 소비 니즈
                    근거 키워드: %s. 고객 니즈는 가격만이 아니라 편의성, 속도, 경험, 재방문 이유가 함께 작동한다.
                    """.formatted(sourceTitle, evidence).trim();
            case REVENUE_STRATEGY -> """
                    ## 객단가
                    %s 흐름은 매출을 단순 방문자 수가 아니라 객단가와 구매 조합으로 봐야 한다는 점을 시사한다.

                    ## 회전율과 재방문
                    회전율이 높아도 재방문이 낮으면 장기 매출은 흔들릴 수 있다. 운영자는 피크 시간 처리와 비피크 시간 유입 전략을 같이 설계해야 한다.

                    ## 수익성 개선
                    근거 키워드: %s. 수익성은 가격 인상보다 원가, 인력 배치, 재구매 상품 설계에서 먼저 개선 여지를 찾는 편이 안전하다.
                    """.formatted(sourceTitle, evidence).trim();
            case RISK_ANALYSIS -> """
                    ## 폐업 위험
                    %s 흐름은 초기 매출 전망보다 버틸 수 있는 기간과 비용 구조를 먼저 계산해야 한다는 점을 보여준다.

                    ## 경쟁 과밀과 임대료
                    같은 업종이 몰린 상권은 수요가 검증됐다는 장점이 있지만, 임대료와 마케팅 비용이 빠르게 올라갈 수 있다.

                    ## 운영 리스크
                    근거 키워드: %s. 인건비, 수수료, 원재료, 계약 조건을 나눠 점검해야 예상치 못한 손실을 줄일 수 있다.
                    """.formatted(sourceTitle, evidence).trim();
        };
    }

    private String sanitize(String content) {
        String normalized = content == null ? "" : content.replaceAll("\\s+", " ").trim();
        normalized = normalized
                .replaceAll("\\[기사 \\d+\\]", "")
                .replace("제목:", "")
                .replace("URL:", "")
                .replace("본문:", "")
                .replace("수집 본문:", "")
                .replace("(직접 입력)", "")
                .trim();
        if (normalized.length() > EVIDENCE_LIMIT) {
            normalized = normalized.substring(0, EVIDENCE_LIMIT).trim();
        }
        return normalized.isBlank() ? "상권, 창업, 프랜차이즈" : normalized;
    }

    private String limit(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 1).trim() + "...";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
