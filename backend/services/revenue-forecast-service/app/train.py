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
MODEL_PATH = ARTIFACT_DIR / "revenue_forecast.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
SEED = 42

NUMERIC_FEATURES = [
    "quarter_code",
    "resident_population_total",
    "resident_age_20_30_ratio",
    "resident_age_40_60_ratio",
    "worker_population_total",
    "living_population_total",
    "subway_peak_boarding",
    "subway_peak_alighting",
    "food_spend_ratio",
    "apparel_spend_ratio",
    "medical_spend_ratio",
    "weekday_sales_ratio",
    "weekend_sales_ratio",
    "lunch_sales_ratio",
    "dinner_sales_ratio",
    "store_count",
    "franchise_store_count",
    "opening_store_count",
    "closing_store_count",
    "facility_total_count",
    "hospital_count",
    "school_count",
    "apartment_household_count",
    "apartment_avg_price_million_krw",
    "rent_per_sqm_thousand_krw",
    "vacancy_rate",
    "lag_1_estimated_sales_million_krw",
    "lag_4_estimated_sales_million_krw",
]
CATEGORICAL_FEATURES = ["district_code", "district_name", "borough", "service_category"]
TARGET = "next_quarter_estimated_sales_million_krw"

SOURCE_FIELD_MAP = {
    "quarter_code": "기준_년분기_코드",
    "district_code": "행정동_코드",
    "district_name": "행정동_코드_명",
    "service_category": "서비스_업종_코드_명",
    "resident_population_total": "상주인구-행정동 총_상주인구_수",
    "worker_population_total": "직장인구-행정동 총_직장_인구_수",
    "living_population_total": "행정동 단위 서울 생활인구 총생활인구수",
    "subway_peak_boarding": "지하철 시간대별 승차 인원",
    "subway_peak_alighting": "지하철 시간대별 하차 인원",
    "food_spend_ratio": "소비-행정동 식료품 소비 비중",
    "store_count": "점포-행정동 전체_점포_수",
    "franchise_store_count": "점포-행정동 프랜차이즈_점포_수",
    "opening_store_count": "점포-행정동 개업_점포_수",
    "closing_store_count": "점포-행정동 폐업_점포_수",
    "facility_total_count": "집객시설-행정동 집객시설_수",
    "apartment_avg_price_million_krw": "아파트-행정동 아파트_평균_가격",
    "rent_per_sqm_thousand_krw": "매장용빌딩/상업용부동산 임대료",
    "vacancy_rate": "매장용빌딩/상업용부동산 공실률",
    TARGET: "추정매출-행정동 다음 분기 당월_매출_금액",
}

DISTRICTS = [
    ("1168064000", "강남구 역삼동", "강남구"),
    ("1144066000", "마포구 상암동", "마포구"),
    ("1120069000", "성동구 성수동", "성동구"),
    ("1111065000", "종로구 혜화동", "종로구"),
    ("1171063100", "송파구 잠실동", "송파구"),
    ("1154563000", "금천구 가산동", "금천구"),
    ("1159068000", "동작구 사당동", "동작구"),
    ("1129066000", "성북구 안암동", "성북구"),
]
CATEGORIES = ["coffee", "korean_food", "dessert", "fitness", "fast_food", "salon", "retail"]


def generate_mock_data(rows: int = 1120) -> pd.DataFrame:
    rng = np.random.default_rng(SEED)
    records: list[dict[str, Any]] = []

    for idx in range(rows):
        quarter_index = idx % 28
        quarter_code = 202001 + quarter_index
        district_code, district_name, borough = DISTRICTS[(idx + quarter_index) % len(DISTRICTS)]
        service_category = CATEGORIES[(idx // 4 + quarter_index) % len(CATEGORIES)]
        district_rank = DISTRICTS.index((district_code, district_name, borough))
        quarter_season = 1.0 + 0.12 * np.sin((quarter_index % 4) / 4 * 2 * np.pi)
        resident_population = 18000 + district_rank * 1700 + (idx % 21) * 850
        worker_population = 9000 + (idx % 29) * 1100 + (18000 if borough in {"강남구", "마포구"} else 0)
        living_population = resident_population + worker_population + 7000 + (idx % 17) * 930
        subway_boarding = 8500 + (idx % 31) * 1350 + (15000 if borough in {"강남구", "송파구"} else 0)
        subway_alighting = subway_boarding * (0.88 + (idx % 9) * 0.025)
        food_spend_ratio = 0.16 + (idx % 11) * 0.018 + (0.08 if service_category in {"coffee", "korean_food", "fast_food"} else 0)
        apparel_spend_ratio = 0.06 + (idx % 8) * 0.012 + (0.06 if service_category == "retail" else 0)
        medical_spend_ratio = 0.04 + (idx % 7) * 0.01 + (0.03 if borough in {"송파구", "강남구"} else 0)
        weekday_ratio = 0.52 + (0.08 if borough in {"강남구", "마포구", "금천구"} else 0) + rng.normal(0, 0.02)
        weekend_ratio = max(0.18, 1.0 - weekday_ratio + rng.normal(0, 0.01))
        lunch_ratio = 0.23 + (0.07 if service_category in {"korean_food", "fast_food"} else 0) + rng.normal(0, 0.015)
        dinner_ratio = 0.22 + (0.06 if service_category in {"korean_food", "fitness"} else 0) + rng.normal(0, 0.015)
        store_count = 24 + (idx % 41)
        franchise_store_count = 3 + (idx % 19)
        opening_store_count = 1 + (idx % 10)
        closing_store_count = 1 + ((idx + 5) % 9)
        facility_total = 32 + (idx % 55) + (18 if borough in {"강남구", "종로구"} else 0)
        hospital_count = 2 + (idx % 9) + (5 if borough == "강남구" else 0)
        school_count = 1 + (idx % 7) + (4 if borough in {"성북구", "종로구"} else 0)
        apartment_households = 2500 + (idx % 37) * 190 + (2500 if borough in {"송파구", "동작구"} else 0)
        apartment_price = 520 + district_rank * 70 + (900 if borough == "강남구" else 0) + (idx % 13) * 32
        rent = 36 + district_rank * 3.8 + (30 if borough == "강남구" else 0) + (idx % 12) * 2.4
        vacancy = 4.2 + (idx % 11) * 0.55 + max(0, closing_store_count - opening_store_count) * 0.42
        category_boost = {
            "coffee": 1.08,
            "korean_food": 1.16,
            "dessert": 0.98,
            "fitness": 0.84,
            "fast_food": 1.18,
            "salon": 0.74,
            "retail": 0.92,
        }[service_category]
        lag_4 = (
            42
            + living_population / 2600
            + subway_boarding / 1900
            + worker_population / 3600
            + store_count * 0.42
            + franchise_store_count * 0.75
            + food_spend_ratio * 42
            - rent * 0.09
            - vacancy * 0.65
        ) * category_boost
        lag_1 = lag_4 * (0.96 + quarter_season * 0.08 + rng.normal(0, 0.035))
        target = (
            lag_1 * 0.58
            + lag_4 * 0.24
            + living_population / 3800
            + subway_alighting / 3100
            + facility_total * 0.16
            + weekend_ratio * 12
            + opening_store_count * 0.62
            - closing_store_count * 0.9
            - rent * 0.04
            - vacancy * 0.55
            + rng.normal(0, 3.8)
        )
        records.append(
            {
                "quarter_code": quarter_code,
                "district_code": district_code,
                "district_name": district_name,
                "borough": borough,
                "service_category": service_category,
                "resident_population_total": int(resident_population),
                "resident_age_20_30_ratio": round(float(0.22 + (idx % 9) * 0.018), 3),
                "resident_age_40_60_ratio": round(float(0.28 + (idx % 8) * 0.019), 3),
                "worker_population_total": int(worker_population),
                "living_population_total": int(living_population),
                "subway_peak_boarding": int(subway_boarding),
                "subway_peak_alighting": int(subway_alighting),
                "food_spend_ratio": round(float(food_spend_ratio), 3),
                "apparel_spend_ratio": round(float(apparel_spend_ratio), 3),
                "medical_spend_ratio": round(float(medical_spend_ratio), 3),
                "weekday_sales_ratio": round(float(weekday_ratio), 3),
                "weekend_sales_ratio": round(float(weekend_ratio), 3),
                "lunch_sales_ratio": round(float(lunch_ratio), 3),
                "dinner_sales_ratio": round(float(dinner_ratio), 3),
                "store_count": store_count,
                "franchise_store_count": franchise_store_count,
                "opening_store_count": opening_store_count,
                "closing_store_count": closing_store_count,
                "facility_total_count": facility_total,
                "hospital_count": hospital_count,
                "school_count": school_count,
                "apartment_household_count": apartment_households,
                "apartment_avg_price_million_krw": round(float(apartment_price), 3),
                "rent_per_sqm_thousand_krw": round(float(rent), 3),
                "vacancy_rate": round(float(vacancy), 3),
                "lag_1_estimated_sales_million_krw": round(float(max(lag_1, 8)), 3),
                "lag_4_estimated_sales_million_krw": round(float(max(lag_4, 8)), 3),
                TARGET: round(float(max(target, 8)), 3),
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
        n_estimators=260,
        max_depth=4,
        learning_rate=0.045,
        subsample=0.92,
        colsample_bytree=0.88,
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
            "https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22166/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22169/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22183/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do",
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
