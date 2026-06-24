from __future__ import annotations

from app.core.config import settings
from app.models.commercial_trend.predict import load_meta
from app.models.commercial_trend.runtime import get_theme_rankings
from app.trend.contracts import (
    TrendForecastBanner,
    TrendForecastCta,
    TrendForecastMetric,
    TrendForecastTheme,
)

# 주제당 노출할 상권 수
TOP_N = 3

# 노출 순서와 라벨. all/male/female/youth는 예측 증감률, weekend는 주말 쏠림(전체에서 파생).
PREDICTIVE_THEMES = [
    ("all", "전체 인기"),
    ("evening", "저녁 인기"),
    ("male", "남성 인기"),
    ("female", "여성 인기"),
    ("youth", "청년 인기"),
]
WEEKEND_LABEL = "주말 인기"


def _metric_description(signals: dict[str, float]) -> str:
    """지배적인 신호를 골라 사람이 읽을 설명 문구로 바꾼다(규칙 기반, LLM 아님)."""
    weekend = signals.get("weekend_ratio", 0.0)
    wow = signals.get("wow_change", 0.0)
    slope = signals.get("slope_28", 0.0)

    if weekend >= 0.12:
        return "주말 유입 강세"
    if wow >= 0.03:
        return "최근 1주 방문 급증"
    if slope > 0:
        return "꾸준한 유동인구 상승세"
    return "하락 후 반등 신호"


def _format_growth(pred_growth: float) -> str:
    """예측 증감률을 부호 있는 퍼센트로(예: '▲ +6.0%')."""
    return f"▲ +{pred_growth * 100:.1f}%"


def _predictive_metrics(ranking: list[dict[str, object]]) -> list[TrendForecastMetric]:
    """양수 예측(상승) 상권만, 예측 증감률 내림차순 상위 N개."""
    risers = sorted(
        (item for item in ranking if float(item["pred_growth"]) > 0),  # type: ignore[arg-type]
        key=lambda item: float(item["pred_growth"]),  # type: ignore[arg-type]
        reverse=True,
    )
    return [
        TrendForecastMetric(
            label=str(item["area_name"]),
            value=_format_growth(float(item["pred_growth"])),  # type: ignore[arg-type]
            description=_metric_description(item.get("signals", {})),  # type: ignore[arg-type]
        )
        for item in risers[:TOP_N]
    ]


def _weekend_metrics(all_ranking: list[dict[str, object]]) -> list[TrendForecastMetric]:
    """주말 쏠림(weekend_ratio) 상위 N개. 전체 주제의 신호에서 파생한다."""
    ranked = sorted(
        all_ranking,
        key=lambda item: float(item.get("signals", {}).get("weekend_ratio", 0.0)),  # type: ignore[union-attr]
        reverse=True,
    )
    metrics: list[TrendForecastMetric] = []
    for item in ranked[:TOP_N]:
        ratio = float(item.get("signals", {}).get("weekend_ratio", 0.0))  # type: ignore[union-attr]
        metrics.append(
            TrendForecastMetric(
                label=str(item["area_name"]),
                value=f"주말 +{ratio * 100:.0f}%",
                description="주말 유입 강세",
            )
        )
    return metrics


def _direction_accuracy() -> float | None:
    try:
        validation = load_meta().get("validation")
    except FileNotFoundError:
        return None
    if not isinstance(validation, dict):
        return None
    value = validation.get("direction_accuracy")
    return float(value) if value is not None else None


def build_banner(data_mode: str | None = None) -> TrendForecastBanner:
    """주제별 배너 DTO. 전체·주말·남성·여성·청년 각 상위 N개."""
    mode = data_mode or settings.data_mode
    rankings = get_theme_rankings(mode)

    themes: list[TrendForecastTheme] = []
    for key, label in PREDICTIVE_THEMES:
        metrics = _predictive_metrics(rankings.get(key, []))
        if metrics:
            themes.append(TrendForecastTheme(key=key, label=label, metrics=metrics))
    # 주말 인기: 전체 주제의 weekend_ratio에서 파생
    weekend_metrics = _weekend_metrics(rankings.get("all", []))
    if weekend_metrics:
        themes.insert(1, TrendForecastTheme(key="weekend", label=WEEKEND_LABEL, metrics=weekend_metrics))

    all_metrics = themes[0].metrics if themes else []
    if all_metrics:
        title = f"다음 주 반등 예상 1순위는 {all_metrics[0].label}, 생활인구 {all_metrics[0].value} 예상."
    else:
        title = "다음 주 뚜렷한 반등 상권이 보이지 않습니다."

    description = "최근 한 달 생활인구 흐름을 주제별로 학습해 다음 주 뜨는 상권을 예측합니다."
    accuracy = _direction_accuracy()
    if accuracy is not None:
        description += f" 과거 방향 적중률 {round(accuracy * 100)}%."

    return TrendForecastBanner(
        eyebrow="AI 트렌드 예측",
        title=title,
        description=description,
        primary_cta=TrendForecastCta(label="상권 지도에서 검증하기", href="/map"),
        secondary_cta=TrendForecastCta(label="성향 분석 먼저 하기", href="/onboarding"),
        metrics=all_metrics,
        themes=themes,
    )
