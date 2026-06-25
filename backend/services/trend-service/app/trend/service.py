from __future__ import annotations

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
    """예측 카드의 짧은 전망 문구. 모델은 역추세라 미래형으로, 신호별로 갈라 적는다."""
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


def _predicted_metrics(picks: list[dict[str, object]]) -> list[TrendForecastMetric]:
    """검증된 예측 모델의 '곧 뜰 동네' 상위 N. 점수 대신 전망 문구 + 현재 생활인구."""
    return [
        TrendForecastMetric(
            label=str(pick["area_name"]),
            value=_forecast_phrase(pick.get("signals", {})),  # type: ignore[arg-type]
            description=f"생활인구 {float(pick['level']):,.0f}명",  # type: ignore[arg-type]
        )
        for pick in picks[:TOP_N]
    ]


def _popular_metrics(picks: list[dict[str, object]]) -> list[TrendForecastMetric]:
    """상업시간대 규모 기준 '지금 인기 상권' 상위 N(예측 아님, 사실 보고). 명=실제 동시 인원."""
    metrics: list[TrendForecastMetric] = []
    for pick in picks[:TOP_N]:
        level = float(pick["level"])  # type: ignore[arg-type]
        vitality = float(pick["vitality"])  # type: ignore[arg-type]
        metrics.append(
            TrendForecastMetric(
                label=str(pick["area_name"]),
                value=f"{level:,.0f}명",
                description=f"낮 유동 {vitality:.1f}배",
            )
        )
    return metrics


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
