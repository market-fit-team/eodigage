package com.marketfit.post.application.report;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.marketfit.post.core.post.PostCategory;

public enum LlmReportPerspective {
    TREND(
            "트렌드",
            PostCategory.TREND,
            "시장 변화와 소비 패턴을 읽는 창업 칼럼",
            "시장 변화, 소비 패턴, 업계 흐름을 중심으로 작성한다.",
            """
            ## 시장 변화
            ## 소비 패턴
            ## 업계 흐름
            """
    ),
    COMMERCIAL_DISTRICT(
            "상권",
            PostCategory.TREND,
            "입지와 유동인구로 보는 상권 칼럼",
            "입지, 유동인구, 주변 업종, 매출 가능성을 중심으로 작성한다.",
            """
            ## 입지 조건
            ## 유동인구와 주변 업종
            ## 매출 가능성
            """
    ),
    STARTUP(
            "창업",
            PostCategory.GUIDE,
            "예비창업자가 확인할 실행 칼럼",
            "예비 창업자 관점에서 초기 비용, 운영 전략, 실행 우선순위를 중심으로 작성한다.",
            """
            ## 초기 비용
            ## 운영 전략
            ## 실행 우선순위
            """
    ),
    FRANCHISE(
            "프랜차이즈",
            PostCategory.GUIDE,
            "프랜차이즈 시장성과 가맹 전략 칼럼",
            "브랜드 확장, 가맹점, 프랜차이즈 시장성, 창업 아이템을 중심으로 작성한다.",
            """
            ## 브랜드 확장
            ## 가맹점 관점
            ## 창업 아이템
            """
    ),
    CONSUMER_ANALYSIS(
            "소비자 분석",
            PostCategory.TREND,
            "고객층과 방문 패턴을 해석하는 소비자 칼럼",
            "고객층, 소비 연령대, 방문 패턴, 니즈를 중심으로 작성한다.",
            """
            ## 고객층
            ## 방문 패턴
            ## 소비 니즈
            """
    ),
    REVENUE_STRATEGY(
            "매출 전략",
            PostCategory.GUIDE,
            "객단가와 재방문을 높이는 매출 전략 칼럼",
            "객단가, 회전율, 재방문, 수익성 개선을 중심으로 작성한다.",
            """
            ## 객단가
            ## 회전율과 재방문
            ## 수익성 개선
            """
    ),
    RISK_ANALYSIS(
            "리스크 분석",
            PostCategory.POLICY,
            "폐업 위험과 운영 부담을 점검하는 리스크 칼럼",
            "폐업 위험, 경쟁 과밀, 임대료, 운영 리스크를 중심으로 작성한다.",
            """
            ## 폐업 위험
            ## 경쟁 과밀과 임대료
            ## 운영 리스크
            """
    );

    private final String label;
    private final PostCategory category;
    private final String titleGuide;
    private final String promptInstruction;
    private final String sectionOutline;

    LlmReportPerspective(
            String label,
            PostCategory category,
            String titleGuide,
            String promptInstruction,
            String sectionOutline
    ) {
        this.label = label;
        this.category = category;
        this.titleGuide = titleGuide;
        this.promptInstruction = promptInstruction;
        this.sectionOutline = sectionOutline;
    }

    public static List<LlmReportPerspective> randomSelection(int count) {
        if (count < 1 || count > values().length) {
            throw new IllegalArgumentException("count must be between 1 and " + values().length);
        }
        List<LlmReportPerspective> perspectives = new ArrayList<>(List.of(values()));
        Collections.shuffle(perspectives);
        return List.copyOf(perspectives.subList(0, count));
    }

    public String label() {
        return label;
    }

    public PostCategory category() {
        return category;
    }

    public String titleGuide() {
        return titleGuide;
    }

    public String promptInstruction() {
        return promptInstruction;
    }

    public String sectionOutline() {
        return sectionOutline;
    }
}
