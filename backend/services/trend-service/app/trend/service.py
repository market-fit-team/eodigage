from __future__ import annotations

from typing import cast

from app.core.config import settings
from app.models.commercial_trend.runtime import get_banner_sections
from app.trend.contracts import (
    TrendForecastBanner,
    TrendForecastCta,
    TrendForecastMetric,
    TrendForecastTheme,
)

# 주제당 노출할 상권 수
TOP_N = 3

# 노출 순서와 라벨. 각 세그먼트에 '곧 뜰(예측)'과 '요즘 뜨는(실측)'을 함께 담는다.
SEGMENT_THEMES = [
    ("combined", "전체"),
    ("male", "남성"),
    ("female", "여성"),
    ("youth", "20·30대"),
]


def _forecast_phrase(signals: dict[str, float]) -> str:
    """예측 카드의 짧은 전망 문구. forward-slope 모델 피처 신호로 갈라 적는다."""
    accel = signals.get("accel", 0.0)
    recent = signals.get("recent_vs_win", 0.0)
    vol = signals.get("vol", 0.0)
    if accel > 0:
        return "반등 시작"
    if recent < -0.01:
        return "저점 회복 흐름"
    if vol < 0.02:
        return "안정적 상승 전망"
    return "상승 전망"


def _forecast_description(signals: dict[str, float]) -> str:
    """예측 카드에 붙이는 짧은 근거 문구. 수치 대신 흐름만 설명한다."""
    accel = signals.get("accel", 0.0)
    recent = signals.get("recent_vs_win", 0.0)
    vol = signals.get("vol", 0.0)
    if accel > 0:
        return "최근 흐름보다 앞으로의 상승 여지가 큽니다."
    if recent < -0.01:
        return "잠잠했던 유입이 다시 살아나는 구간입니다."
    if vol < 0.02:
        return "흔들림이 작고 완만한 상승세가 예상됩니다."
    return "다음 8주 유입 증가 가능성을 높게 본 상권입니다."


def _predicted_metrics(picks: list[dict[str, object]]) -> list[TrendForecastMetric]:
    """검증된 forward-slope 모델의 '곧 뜰 동네' 상위 N.

    미래 예측이라 현재 절대값(생활인구 등)은 보여주지 않는다. 모델은 절대 인원이 아니라
    상대적 상승 가능성을 예측하므로, 전망 문구와 짧은 설명만 노출한다.
    """
    metrics: list[TrendForecastMetric] = []
    for pick in picks[:TOP_N]:
        signals = cast(dict[str, float], pick.get("signals", {}))
        phrase = _forecast_phrase(signals)
        metrics.append(
            TrendForecastMetric(
                label=str(pick["area_name"]),
                value=phrase,
                description=_forecast_description(signals),
            )
        )
    return metrics


def _popular_metrics(picks: list[dict[str, object]]) -> list[TrendForecastMetric]:
    """상업시간대 실측 규모 상위 '지금 인기 상권'. 순위만 노출(이름의 정렬 순서 = 순위).

    level은 '최근 4주 낮시간대 평균 생활인구(추정·존재)'라 실시간도 유동인구도 아니어서 그대로
    노출하면 오해를 부른다. 그래서 절대 인원·비율은 보여주지 않고, 순위(리스트 순서)만 남긴다.
    """
    return [
        TrendForecastMetric(
            label=str(pick["area_name"]),
            value="",
            description="최근 상업시간대 생활인구가 많은 상권입니다.",
        )
        for pick in picks[:TOP_N]
    ]


def build_banner(data_mode: str | None = None) -> TrendForecastBanner:
    """주제별 배너 DTO. 전체·남성·여성·20·30대 각각 예측(곧 뜰)+인기(요즘 뜨는)."""
    mode = data_mode or settings.data_mode
    sections = get_banner_sections(mode)
    forecast = sections["forecast"]
    popular = sections["popular"]

    themes: list[TrendForecastTheme] = []
    for key, label in SEGMENT_THEMES:
        predicted = _predicted_metrics(forecast.get(key, []))
        pop = _popular_metrics(popular.get(key, []))
        if predicted or pop:
            themes.append(TrendForecastTheme(key=key, label=label, predicted=predicted, popular=pop))

    predicted_combined = themes[0].predicted if themes else []
    if predicted_combined:
        title = f"앞으로 주목할 동네, {predicted_combined[0].label}"
    else:
        title = "뚜렷한 반등 상권이 아직 보이지 않습니다."

    return TrendForecastBanner(
        eyebrow="AI 트렌드 예측",
        title=title,
        description="AI가 고른 '곧 뜰 동네'와, 요즘 실제로 사람이 몰리는 동네를 함께 보여줍니다.",
        primary_cta=TrendForecastCta(label="상권 지도에서 검증하기", href="/map"),
        secondary_cta=TrendForecastCta(label="성향 분석 먼저 하기", href="/onboarding"),
        metrics=predicted_combined,
        themes=themes,
    )
