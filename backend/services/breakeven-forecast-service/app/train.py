from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

ARTIFACT_DIR = Path(os.getenv("MODEL_DIR", "/app/model-artifacts"))
MODEL_PATH = ARTIFACT_DIR / "breakeven_forecast.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
SEED = 44

NUMERIC_FEATURES = [
    "initial_cost_million_krw",
    "franchise_deposit_million_krw",
    "franchise_education_million_krw",
    "franchise_other_cost_million_krw",
    "monthly_rent_million_krw",
    "rent_per_sqm_thousand_krw",
    "vacancy_rate",
    "monthly_labor_cost_million_krw",
    "expected_monthly_sales_million_krw",
    "avg_brand_sales_million_krw",
    "avg_sales_per_area_million_krw",
    "gross_margin_rate",
    "delivery_ratio",
    "store_count",
    "franchise_store_count",
    "opening_store_count",
    "closing_store_count",
    "average_operating_months",
    "survival_rate_3y",
    "closure_rate",
    "change_indicator_score",
    "facility_total_count",
    "subway_peak_boarding",
    "working_capital_million_krw",
]
CATEGORICAL_FEATURES = [
    "district_code",
    "district_name",
    "borough",
    "service_category",
    "district_grade",
    "store_size",
    "commercial_change_grade",
]
TARGET = "breakeven_months"

SOURCE_FIELD_MAP = {
    "average_operating_months": "서울시 영세자영업 자치구별 평균 영업기간",
    "survival_rate_3y": "서울시 영세자영업 경영활동 현황 생존율",
    "opening_store_count": "상권분석서비스(점포-행정동) 개업 점포 수",
    "closing_store_count": "상권분석서비스(점포-행정동) 폐업 점포 수",
    "change_indicator_score": "상권분석서비스(상권변화지표-행정동) 상권 확대/축소 지표",
    "franchise_deposit_million_krw": "공정거래위원회 브랜드별/업종별 창업비용 가맹보증금",
    "franchise_education_million_krw": "공정거래위원회 브랜드별/업종별 창업비용 교육비",
    "franchise_other_cost_million_krw": "공정거래위원회 브랜드별/업종별 창업비용 기타비용",
    "avg_brand_sales_million_krw": "공정거래위원회 브랜드별 가맹점 평균매출",
    "avg_sales_per_area_million_krw": "공정거래위원회 브랜드별 면적단위 평균매출",
    "rent_per_sqm_thousand_krw": "서울시 매장용빌딩/상업용부동산 임대료",
    "vacancy_rate": "서울시 매장용빌딩/상업용부동산 공실률",
    TARGET: "초기 투자금 회수 예상 개월 수 목 표본",
}

DISTRICTS = [
    ("1168064000", "강남구 역삼동", "강남구", "A"),
    ("1144066000", "마포구 상암동", "마포구", "A"),
    ("1120069000", "성동구 성수동", "성동구", "B"),
    ("1111065000", "종로구 혜화동", "종로구", "B"),
    ("1171063100", "송파구 잠실동", "송파구", "B"),
    ("1154563000", "금천구 가산동", "금천구", "C"),
    ("1159068000", "동작구 사당동", "동작구", "C"),
    ("1129066000", "성북구 안암동", "성북구", "D"),
]
CATEGORIES = ["coffee", "korean_food", "dessert", "fitness", "fast_food", "salon", "retail"]
SIZES = ["small", "medium", "large"]
CHANGE_GRADES = ["expansion", "stable", "contraction"]


def generate_mock_data(rows: int = 1120) -> pd.DataFrame:
    rng = np.random.default_rng(SEED)
    records: list[dict[str, Any]] = []

    for idx in range(rows):
        district_code, district_name, borough, district_grade = DISTRICTS[idx % len(DISTRICTS)]
        service_category = CATEGORIES[(idx // 5) % len(CATEGORIES)]
        store_size = SIZES[(idx // 9) % len(SIZES)]
        commercial_change_grade = CHANGE_GRADES[(idx // 13) % len(CHANGE_GRADES)]
        grade_multiplier = {"A": 1.22, "B": 1.08, "C": 0.96, "D": 0.84}[district_grade]
        size_multiplier = {"small": 0.78, "medium": 1.0, "large": 1.34}[store_size]
        change_score = {"expansion": 0.85, "stable": 0.52, "contraction": 0.22}[commercial_change_grade]
        store_count = 24 + (idx % 44)
        franchise_store_count = 3 + (idx % 19)
        opening_store_count = 1 + (idx % 11) + int(commercial_change_grade == "expansion") * 2
        closing_store_count = 1 + ((idx + 6) % 10) + int(commercial_change_grade == "contraction") * 2
        closure_rate = closing_store_count / max(store_count, 1)
        survival_rate_3y = max(0.18, 0.68 - closure_rate * 1.35 + change_score * 0.18)
        average_operating_months = 24 + survival_rate_3y * 58 + grade_multiplier * 7 - closure_rate * 18
        deposit = 8 + (idx % 9) * 2.4
        education = 2 + (idx % 6) * 0.8
        other_cost = 24 + (idx % 13) * 4.5
        initial_cost = (62 + (idx % 18) * 8.8) * size_multiplier + deposit + education + other_cost
        rent_per_sqm = 33 + DISTRICTS.index((district_code, district_name, borough, district_grade)) * 3.6
        rent_per_sqm += 32 if borough == "강남구" else 0
        monthly_rent = rent_per_sqm * (18 if store_size == "small" else 32 if store_size == "medium" else 55) / 1000
        vacancy_rate = 3.8 + (idx % 12) * 0.55 + (2.6 if commercial_change_grade == "contraction" else 0)
        labor = (5.2 + (idx % 11) * 0.38) * size_multiplier
        working_capital = 18 + (idx % 12) * 2.8
        gross_margin = 0.32 + (idx % 12) * 0.014 + (0.04 if service_category == "dessert" else 0)
        delivery_ratio = 0.06 + (idx % 10) * 0.036 + (0.13 if service_category in {"fast_food", "korean_food"} else 0)
        facility_total = 34 + (idx % 55) + (16 if borough in {"강남구", "종로구"} else 0)
        subway_peak = 8500 + (idx % 31) * 1300 + (16000 if borough in {"강남구", "송파구"} else 0)
        avg_brand_sales = (
            44 * grade_multiplier
            + facility_total * 0.33
            + subway_peak / 2600
            + franchise_store_count * 0.85
            + change_score * 18
            - vacancy_rate * 0.95
            + rng.normal(0, 3.2)
        )
        avg_sales_per_area = avg_brand_sales / (11 + (idx % 12))
        expected_sales = avg_brand_sales * (0.82 + size_multiplier * 0.18 + rng.normal(0, 0.035))
        monthly_contribution = max(
            expected_sales * gross_margin - monthly_rent - labor - (2.4 + delivery_ratio * 3.5),
            1.0,
        )
        target = (initial_cost + working_capital) / monthly_contribution
        target += closure_rate * 8 + vacancy_rate * 0.18 - survival_rate_3y * 2.2 + rng.normal(0, 0.85)
        records.append(
            {
                "district_code": district_code,
                "district_name": district_name,
                "borough": borough,
                "service_category": service_category,
                "district_grade": district_grade,
                "store_size": store_size,
                "commercial_change_grade": commercial_change_grade,
                "initial_cost_million_krw": round(float(max(initial_cost, 20)), 3),
                "franchise_deposit_million_krw": round(float(deposit), 3),
                "franchise_education_million_krw": round(float(education), 3),
                "franchise_other_cost_million_krw": round(float(other_cost), 3),
                "monthly_rent_million_krw": round(float(monthly_rent), 3),
                "rent_per_sqm_thousand_krw": round(float(rent_per_sqm), 3),
                "vacancy_rate": round(float(vacancy_rate), 3),
                "monthly_labor_cost_million_krw": round(float(labor), 3),
                "expected_monthly_sales_million_krw": round(float(max(expected_sales, 12)), 3),
                "avg_brand_sales_million_krw": round(float(max(avg_brand_sales, 12)), 3),
                "avg_sales_per_area_million_krw": round(float(max(avg_sales_per_area, 1)), 3),
                "gross_margin_rate": round(float(gross_margin), 3),
                "delivery_ratio": round(float(delivery_ratio), 3),
                "store_count": store_count,
                "franchise_store_count": franchise_store_count,
                "opening_store_count": opening_store_count,
                "closing_store_count": closing_store_count,
                "average_operating_months": round(float(average_operating_months), 3),
                "survival_rate_3y": round(float(survival_rate_3y), 3),
                "closure_rate": round(float(closure_rate), 4),
                "change_indicator_score": round(float(change_score), 3),
                "facility_total_count": facility_total,
                "subway_peak_boarding": int(subway_peak),
                "working_capital_million_krw": round(float(working_capital), 3),
                TARGET: round(float(max(target, 3)), 3),
            }
        )
    return pd.DataFrame.from_records(records)


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("numeric", "passthrough", NUMERIC_FEATURES),
        ]
    )
    model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=240,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=SEED,
        n_jobs=2,
    )
    return Pipeline([("preprocess", preprocessor), ("model", model)])


def train_and_save() -> dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    data = generate_mock_data()
    features = CATEGORICAL_FEATURES + NUMERIC_FEATURES
    train_df, test_df = train_test_split(data, test_size=0.22, random_state=SEED)
    pipeline = build_pipeline()
    pipeline.fit(train_df[features], train_df[TARGET])
    predictions = pipeline.predict(test_df[features])
    metrics = {
        "rmse": round(float(np.sqrt(mean_squared_error(test_df[TARGET], predictions))), 4),
        "mae": round(float(mean_absolute_error(test_df[TARGET], predictions)), 4),
        "r2": round(float(r2_score(test_df[TARGET], predictions)), 4),
        "test_rows": int(len(test_df)),
    }
    metadata = {
        "model_type": "xgboost_xgbregressor",
        "target": TARGET,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": int(len(data)),
        "features": features,
        "source_field_map": SOURCE_FIELD_MAP,
        "metrics": metrics,
        "sample_request": data[features].iloc[0].to_dict(),
        "sources": [
            "https://xgboost.readthedocs.io/en/latest/python/sklearn_estimator.html",
            "https://data.seoul.go.kr/dataList/OA-21527/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/DT201015013/S/2/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-15567/S/1/datasetView.do",
            "https://www.data.go.kr/data/15110241/openapi.do",
            "https://www.data.go.kr/data/15110265/openapi.do",
            "https://www.data.go.kr/data/15110293/openapi.do",
        ],
    }
    joblib.dump(pipeline, MODEL_PATH)
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def load_artifacts() -> tuple[Pipeline, dict[str, Any]]:
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        train_and_save()
    return joblib.load(MODEL_PATH), json.loads(METADATA_PATH.read_text(encoding="utf-8"))


if __name__ == "__main__":
    print(json.dumps(train_and_save(), ensure_ascii=False, indent=2))
