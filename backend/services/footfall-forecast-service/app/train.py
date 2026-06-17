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
MODEL_PATH = ARTIFACT_DIR / "footfall_forecast.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
SEED = 43

NUMERIC_FEATURES = [
    "date_index",
    "hour",
    "month",
    "holiday_count",
    "subway_boarding",
    "subway_alighting",
    "living_population_total",
    "living_population_male_ratio",
    "living_population_age_20_30_ratio",
    "living_population_age_40_60_ratio",
    "resident_population_total",
    "worker_population_total",
    "office_worker_ratio",
    "facility_total_count",
    "government_office_count",
    "hospital_count",
    "school_count",
    "apartment_household_count",
    "apartment_avg_price_million_krw",
    "store_count",
    "franchise_store_count",
    "rent_per_sqm_thousand_krw",
    "vacancy_rate",
    "lag_1_hour_footfall",
    "lag_24_hour_footfall",
]
CATEGORICAL_FEATURES = ["district_code", "district_name", "borough", "service_category", "weekday_group"]
TARGET = "next_hour_footfall"

SOURCE_FIELD_MAP = {
    "subway_boarding": "서울시 지하철 호선별 역별 시간대별 승차 인원",
    "subway_alighting": "서울시 지하철 호선별 역별 시간대별 하차 인원",
    "living_population_total": "행정동 단위 서울 생활인구 총생활인구수",
    "resident_population_total": "상권분석서비스(상주인구-행정동) 총 상주인구 수",
    "worker_population_total": "상권분석서비스(직장인구-행정동) 총 직장 인구 수",
    "facility_total_count": "상권분석서비스(집객시설-행정동) 집객시설 수",
    "apartment_household_count": "상권분석서비스(아파트-행정동) 아파트 세대 수",
    "store_count": "상권분석서비스(점포-행정동) 전체 점포 수",
    "rent_per_sqm_thousand_krw": "매장용빌딩/상업용부동산 임대료",
    TARGET: "다음 시간대 행정동 유동인구 목 표본",
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
WEEKDAY_GROUPS = ["weekday", "friday", "weekend"]


def generate_mock_data(rows: int = 1344) -> pd.DataFrame:
    rng = np.random.default_rng(SEED)
    records: list[dict[str, Any]] = []

    for idx in range(rows):
        date_index = idx // 24
        hour = idx % 24
        month = date_index % 12 + 1
        district_code, district_name, borough = DISTRICTS[(idx // 6 + date_index) % len(DISTRICTS)]
        service_category = CATEGORIES[(idx // 13) % len(CATEGORIES)]
        weekday_group = WEEKDAY_GROUPS[(date_index + idx // 24) % len(WEEKDAY_GROUPS)]
        commute_peak = 1.0 if hour in {8, 9, 18, 19} else 0.0
        lunch_peak = 1.0 if hour in {12, 13} else 0.0
        night_peak = 1.0 if hour in {20, 21, 22} else 0.0
        weekend_boost = 1.0 if weekday_group == "weekend" else 0.0
        holiday_count = int(month in {1, 5, 9}) + int(date_index % 17 == 0)
        district_rank = DISTRICTS.index((district_code, district_name, borough))
        resident_population = 17000 + district_rank * 1600 + (idx % 23) * 720
        worker_population = 8000 + (idx % 31) * 870 + (22000 if borough in {"강남구", "마포구", "금천구"} else 0)
        base_living = resident_population + worker_population * (0.45 + commute_peak * 0.4)
        subway_boarding = 4200 + (idx % 37) * 460 + commute_peak * 18000 + lunch_peak * 3500
        subway_boarding += 16000 if borough in {"강남구", "송파구"} else 0
        subway_alighting = subway_boarding * (0.86 + commute_peak * 0.18 + rng.normal(0, 0.025))
        living_population = base_living + subway_alighting * 0.58 + weekend_boost * 6500 + night_peak * 3100
        facility_total = 35 + (idx % 47) + (24 if borough in {"강남구", "종로구"} else 0)
        government_count = 1 + (idx % 6) + (4 if borough == "종로구" else 0)
        hospital_count = 2 + (idx % 9) + (5 if borough == "강남구" else 0)
        school_count = 1 + (idx % 8) + (5 if borough in {"성북구", "종로구"} else 0)
        apartment_households = 2200 + (idx % 41) * 160 + (2800 if borough in {"송파구", "동작구"} else 0)
        apartment_price = 500 + district_rank * 68 + (900 if borough == "강남구" else 0)
        store_count = 22 + (idx % 42)
        franchise_store_count = 3 + (idx % 20)
        rent = 34 + district_rank * 3.4 + (32 if borough == "강남구" else 0) + (idx % 10) * 2.1
        vacancy = 3.5 + (idx % 12) * 0.55
        lag_24 = 1100 + living_population * 0.045 + subway_boarding * 0.18 + facility_total * 8
        lag_1 = lag_24 * (0.86 + commute_peak * 0.14 + weekend_boost * 0.07 + rng.normal(0, 0.035))
        target = (
            lag_1 * 0.46
            + lag_24 * 0.28
            + subway_alighting * 0.22
            + living_population * 0.038
            + worker_population * 0.016
            + facility_total * 13
            + lunch_peak * 900
            + night_peak * 620
            + holiday_count * 360
            - vacancy * 45
            + rng.normal(0, 230)
        )
        records.append(
            {
                "district_code": district_code,
                "district_name": district_name,
                "borough": borough,
                "service_category": service_category,
                "weekday_group": weekday_group,
                "date_index": date_index,
                "hour": hour,
                "month": month,
                "holiday_count": holiday_count,
                "subway_boarding": int(max(subway_boarding, 0)),
                "subway_alighting": int(max(subway_alighting, 0)),
                "living_population_total": int(max(living_population, 0)),
                "living_population_male_ratio": round(float(0.48 + (idx % 5) * 0.01), 3),
                "living_population_age_20_30_ratio": round(float(0.21 + (idx % 9) * 0.018), 3),
                "living_population_age_40_60_ratio": round(float(0.29 + (idx % 8) * 0.017), 3),
                "resident_population_total": int(resident_population),
                "worker_population_total": int(worker_population),
                "office_worker_ratio": round(float(min(worker_population / max(living_population, 1), 0.95)), 3),
                "facility_total_count": facility_total,
                "government_office_count": government_count,
                "hospital_count": hospital_count,
                "school_count": school_count,
                "apartment_household_count": apartment_households,
                "apartment_avg_price_million_krw": round(float(apartment_price), 3),
                "store_count": store_count,
                "franchise_store_count": franchise_store_count,
                "rent_per_sqm_thousand_krw": round(float(rent), 3),
                "vacancy_rate": round(float(vacancy), 3),
                "lag_1_hour_footfall": round(float(max(lag_1, 100)), 3),
                "lag_24_hour_footfall": round(float(max(lag_24, 100)), 3),
                TARGET: int(max(target, 300)),
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
        subsample=0.9,
        colsample_bytree=0.86,
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
            "https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22178/A/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22169/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22183/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22163/S/1/datasetView.do",
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
