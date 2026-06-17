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
from sklearn.metrics import ndcg_score
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRanker

ARTIFACT_DIR = Path(os.getenv("MODEL_DIR", "/app/model-artifacts"))
MODEL_PATH = ARTIFACT_DIR / "franchise_reranker.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
SEED = 54

CATEGORICAL_FEATURES = ["service_category", "district_code", "risk_tolerance"]
NUMERIC_FEATURES = [
    "two_tower_score",
    "budget_gap_million_krw",
    "avg_sales_million_krw",
    "avg_sales_per_area_million_krw",
    "startup_cost_million_krw",
    "rent_million_krw",
    "closure_rate",
    "franchise_store_count",
    "footfall_index",
    "facility_total_count",
    "brand_power",
    "survey_brand_preference",
    "survey_footfall_preference",
]
FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES
SOURCE_FIELD_MAP = {
    "two_tower_score": "투타워 후보 생성 점수",
    "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 추정매출",
    "avg_sales_per_area_million_krw": "공정거래위원회 브랜드별 면적단위 평균매출",
    "closure_rate": "점포/상권변화지표 폐업률",
    "footfall_index": "지하철 승하차/생활인구 유동인구 지표",
}


def generate_mock_data(queries: int = 180, candidates_per_query: int = 12) -> pd.DataFrame:
    rng = np.random.default_rng(SEED)
    categories = ["coffee", "korean_food", "dessert", "fitness", "fast_food", "salon", "retail"]
    districts = ["1168064000", "1144066000", "1120069000", "1111065000", "1171063100", "1154563000"]
    risks = ["low", "medium", "high"]
    rows: list[dict[str, Any]] = []
    for qid in range(queries):
        brand_pref = 0.2 + (qid % 8) * 0.08
        footfall_pref = 0.25 + (qid % 7) * 0.09
        budget = 90 + (qid % 13) * 28
        for rank in range(candidates_per_query):
            category = categories[(qid + rank) % len(categories)]
            district = districts[(qid * 2 + rank) % len(districts)]
            startup = 65 + (rank % 10) * 32 + (qid % 4) * 5
            sales = 38 + (rank % 9) * 8 + (qid % 11) * 1.6
            closure = 0.025 + (rank % 8) * 0.018
            two_tower = 1.0 / (rank + 1) + rng.normal(0, 0.03)
            relevance = (
                two_tower * 2.5
                + sales / 90
                - abs(budget - startup) / 180
                - closure * 2.2
                + brand_pref * (0.35 + (rank % 6) * 0.08)
                + footfall_pref * (55 + (rank % 10) * 4) / 110
                + rng.normal(0, 0.08)
            )
            rows.append(
                {
                    "query_id": qid,
                    "franchise_id": f"candidate-{qid:03d}-{rank:02d}",
                    "service_category": category,
                    "district_code": district,
                    "risk_tolerance": risks[qid % len(risks)],
                    "two_tower_score": round(float(two_tower), 4),
                    "budget_gap_million_krw": round(float(abs(budget - startup)), 3),
                    "avg_sales_million_krw": round(float(sales), 3),
                    "avg_sales_per_area_million_krw": round(float(sales / (8 + rank % 7)), 3),
                    "startup_cost_million_krw": round(float(startup), 3),
                    "rent_million_krw": round(float(3.2 + (rank % 9) * 0.7), 3),
                    "closure_rate": round(float(closure), 4),
                    "franchise_store_count": int(3 + (rank % 19)),
                    "footfall_index": round(float(55 + (rank % 10) * 4), 3),
                    "facility_total_count": int(32 + (rank % 35)),
                    "brand_power": round(float(0.35 + (rank % 6) * 0.08), 3),
                    "survey_brand_preference": round(float(brand_pref), 3),
                    "survey_footfall_preference": round(float(footfall_pref), 3),
                    "relevance": int(np.clip(round(relevance * 2), 0, 5)),
                }
            )
    return pd.DataFrame(rows)


def train_and_save() -> dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    data = generate_mock_data()
    train_queries = set(range(145))
    train_df = data[data["query_id"].isin(train_queries)]
    test_df = data[~data["query_id"].isin(train_queries)]
    preprocessor = ColumnTransformer(
        [("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES), ("numeric", "passthrough", NUMERIC_FEATURES)]
    )
    x_train = preprocessor.fit_transform(train_df[FEATURES])
    x_test = preprocessor.transform(test_df[FEATURES])
    train_group = train_df.groupby("query_id", sort=False).size().to_list()
    model = XGBRanker(
        objective="rank:ndcg",
        n_estimators=180,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=SEED,
        n_jobs=2,
    )
    model.fit(x_train, train_df["relevance"], group=train_group)
    scores = model.predict(x_test)
    ndcgs = []
    offset = 0
    for _, group in test_df.groupby("query_id", sort=False):
        size = len(group)
        ndcgs.append(ndcg_score([group["relevance"].to_numpy()], [scores[offset : offset + size]], k=5))
        offset += size
    metadata = {
        "model_type": "xgboost_xgbranker",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": int(len(data)),
        "queries": 180,
        "features": FEATURES,
        "metrics": {"ndcg_at_5": round(float(np.mean(ndcgs)), 4), "test_queries": 35},
        "sample_candidates": data[FEATURES + ["franchise_id"]].head(6).to_dict("records"),
        "source_field_map": SOURCE_FIELD_MAP,
        "sources": ["https://xgboost.readthedocs.io/en/latest/python/sklearn_estimator.html"],
    }
    joblib.dump({"preprocessor": preprocessor, "model": model}, MODEL_PATH)
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def load_artifacts() -> tuple[dict[str, Any], dict[str, Any]]:
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        train_and_save()
    return joblib.load(MODEL_PATH), json.loads(METADATA_PATH.read_text(encoding="utf-8"))


if __name__ == "__main__":
    print(json.dumps(train_and_save(), ensure_ascii=False, indent=2))
