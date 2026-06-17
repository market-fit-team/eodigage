from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.models.category_opportunity_score.features import build_frame as build_category_frame
from app.models.demand_gap_detector.features import build_frame as build_gap_frame
from app.models.sales_momentum_forecast.features import build_frame as build_momentum_frame

SERVICE_ROOT = Path(__file__).resolve().parents[3]
SAMPLE_SURVEYS = SERVICE_ROOT / ".sample" / "survey_responses.sample.jsonl"
SAMPLE_LABELS = SERVICE_ROOT / ".sample" / "survey_item_labels.sample.csv"

BUDGET_LIMIT = {
    "under_50m": 50.0,
    "50m_100m": 100.0,
    "100m_200m": 200.0,
    "over_200m": 500.0,
}

CATEGORY_COST = {
    "CS100001": 140.0,
    "CS100003": 160.0,
    "CS100004": 190.0,
    "CS100005": 45.0,
    "CS100007": 120.0,
}


def load_survey_responses(path: Path = SAMPLE_SURVEYS) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return pd.DataFrame(rows)


def build_item_features(data_mode: str = "sample") -> pd.DataFrame:
    category = build_category_frame(data_mode)
    momentum = build_momentum_frame(data_mode)[
        ["quarter_code", "area_code", "service_category_code", "trend_label"]
    ].copy()
    gap = build_gap_frame(data_mode)[
        ["quarter_code", "area_code", "service_category_code", "gap_score", "high_gap"]
    ].copy()

    items = category.merge(
        momentum,
        on=["quarter_code", "area_code", "service_category_code"],
        how="left",
    ).merge(
        gap,
        on=["quarter_code", "area_code", "service_category_code"],
        how="left",
    )
    items["item_id"] = items["area_code"].astype(str) + ":" + items["service_category_code"].astype(str)
    items["sales_momentum_up_probability"] = np.where(items["trend_label"] == 2, 0.72, 0.18)
    items["sales_momentum_down_probability"] = np.where(items["trend_label"] == 0, 0.72, 0.14)
    items["subway_commercial_trend_score"] = items["target_score"]
    items["category_opportunity_score"] = items["opportunity_score"]
    items["demand_gap_score"] = items["gap_score"]
    items["startup_cost_million_krw_proxy"] = items["service_category_code"].map(CATEGORY_COST).fillna(120.0)
    items["subway_coverage_level"] = np.where(items["subway_commercial_trend_score"] >= 0.55, "high", "medium")
    numeric_columns = [
        "sales_amount",
        "sales_count",
        "sales_per_count",
        "weekend_sales_ratio",
        "evening_sales_ratio",
        "subway_commercial_trend_score",
        "sales_momentum_up_probability",
        "sales_momentum_down_probability",
        "category_opportunity_score",
        "demand_gap_score",
        "startup_cost_million_krw_proxy",
        "lunch_alighting_ratio",
        "evening_alighting_ratio",
    ]
    catalog = (
        items.sort_values("quarter_code")
        .groupby("item_id", as_index=False)
        .agg(
            {
                "quarter_code": "max",
                "area_code": "first",
                "area_name": "first",
                "service_category_code": "first",
                "service_category_name": "first",
                "subway_coverage_level": "first",
                **{column: "mean" for column in numeric_columns},
            }
        )
    )
    return catalog.fillna(0)


def score_survey_item(survey: pd.Series, item: pd.Series) -> tuple[float, list[str]]:
    reasons: list[str] = []
    score = 0.0

    category = str(item["service_category_code"])
    preferred = set(survey.get("preferred_categories", []))
    avoided = set(survey.get("avoid_categories", []))
    if category in preferred:
        score += 3.0
        reasons.append("preferred_category_match")
    if category in avoided:
        score -= 5.0
        reasons.append("avoid_category_violation")

    budget_limit = BUDGET_LIMIT.get(str(survey["budget_band"]), 100.0)
    if float(item["startup_cost_million_krw_proxy"]) <= budget_limit:
        score += 1.6
        reasons.append("budget_fit")
    else:
        score -= 2.0
        reasons.append("budget_over")

    if int(survey["subway_dependency"]) >= 4:
        score += 2.0 * float(item["subway_commercial_trend_score"])
        reasons.append("subway_dependency_match")
    elif str(survey["location_preference"]) == "residential":
        score += 0.8 * (1.0 - float(item["subway_commercial_trend_score"]))
        reasons.append("residential_bias")

    if str(survey["growth_vs_stability"]) == "growth":
        score += 1.4 * float(item["sales_momentum_up_probability"])
        score += 0.8 * float(item["category_opportunity_score"])
        reasons.append("growth_signal_match")
    elif str(survey["growth_vs_stability"]) == "stability":
        score += 1.0 * (1.0 - float(item["sales_momentum_down_probability"]))
        score -= 0.9 * float(item["demand_gap_score"])
        reasons.append("stability_signal_match")
    else:
        score += 0.8 * float(item["category_opportunity_score"])
        reasons.append("balanced_signal_match")

    if str(survey["operation_time_preference"]) in {"afternoon_evening", "night"}:
        score += 1.2 * float(item["evening_sales_ratio"])
        reasons.append("evening_operation_match")
    if str(survey["operation_time_preference"]) == "morning_lunch":
        score += 1.2 * float(item["lunch_alighting_ratio"])
        reasons.append("lunch_operation_match")

    if int(survey["rent_sensitivity"]) >= 4 and float(item["startup_cost_million_krw_proxy"]) > budget_limit * 0.8:
        score -= 1.3
        reasons.append("rent_budget_pressure")

    return score, reasons


def build_l0_labels(data_mode: str = "sample") -> pd.DataFrame:
    surveys = load_survey_responses()
    items = build_item_features(data_mode)
    rows: list[dict[str, Any]] = []
    for _, survey in surveys.iterrows():
        scored: list[dict[str, Any]] = []
        for _, item in items.iterrows():
            score, reasons = score_survey_item(survey, item)
            scored.append(
                {
                    "survey_response_id": survey["survey_response_id"],
                    "user_id": survey["user_id"],
                    "item_id": item["item_id"],
                    "area_code": item["area_code"],
                    "area_name": item["area_name"],
                    "service_category_code": item["service_category_code"],
                    "service_category_name": item["service_category_name"],
                    "match_score": round(float(score), 6),
                    "reasons": "|".join(reasons),
                }
            )
        scored_df = pd.DataFrame(scored).sort_values("match_score", ascending=False).reset_index(drop=True)
        scored_df["label"] = 0
        valid_positive = ~scored_df["reasons"].str.contains("avoid_category_violation|budget_over", regex=True)
        positive_index = scored_df[valid_positive].head(3).index
        scored_df.loc[positive_index, "label"] = 1
        rows.extend(scored_df.to_dict("records"))
    labels = pd.DataFrame(rows)
    SAMPLE_LABELS.parent.mkdir(parents=True, exist_ok=True)
    labels.to_csv(SAMPLE_LABELS, index=False)
    return labels
