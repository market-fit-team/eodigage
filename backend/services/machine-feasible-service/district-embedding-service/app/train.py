from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ARTIFACT_DIR = Path(os.getenv("MODEL_DIR", "/app/model-artifacts"))
MODEL_PATH = ARTIFACT_DIR / "district_embedding.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
SEED = 55

FEATURES = [
    "avg_sales_million_krw",
    "food_spend_ratio",
    "resident_population_total",
    "worker_population_total",
    "living_population_total",
    "subway_peak_boarding",
    "subway_peak_alighting",
    "facility_total_count",
    "hospital_count",
    "school_count",
    "apartment_household_count",
    "apartment_avg_price_million_krw",
    "store_count",
    "franchise_store_count",
    "opening_store_count",
    "closing_store_count",
    "rent_per_sqm_thousand_krw",
    "vacancy_rate",
]
SOURCE_FIELD_MAP = {
    "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 평균 추정매출",
    "food_spend_ratio": "상권분석서비스(소비-행정동) 식료품 소비 비중",
    "living_population_total": "행정동 단위 서울 생활인구",
    "subway_peak_boarding": "지하철 시간대별 승차 인원",
    "facility_total_count": "상권분석서비스(집객시설-행정동) 집객시설 수",
    "rent_per_sqm_thousand_krw": "매장용빌딩/상업용부동산 임대료",
}


def generate_mock_data(rows: int = 240) -> pd.DataFrame:
    rng = np.random.default_rng(SEED)
    bases = [
        ("1168064000", "강남구 역삼동", "강남구"),
        ("1144066000", "마포구 상암동", "마포구"),
        ("1120069000", "성동구 성수동", "성동구"),
        ("1111065000", "종로구 혜화동", "종로구"),
        ("1171063100", "송파구 잠실동", "송파구"),
        ("1154563000", "금천구 가산동", "금천구"),
        ("1159068000", "동작구 사당동", "동작구"),
        ("1129066000", "성북구 안암동", "성북구"),
    ]
    records: list[dict[str, Any]] = []
    for idx in range(rows):
        code, name, borough = bases[idx % len(bases)]
        cluster = idx % 4
        worker_boost = 18000 if cluster == 0 else 4000
        resident_boost = 16000 if cluster == 1 else 3000
        leisure_boost = 12000 if cluster == 2 else 2000
        rent_boost = 35 if borough == "강남구" else 8 * cluster
        records.append(
            {
                "district_item_id": f"{code}-{idx // len(bases):02d}",
                "district_code": code,
                "district_name": name,
                "borough": borough,
                "cluster_hint": cluster,
                "avg_sales_million_krw": round(float(45 + cluster * 12 + (idx % 17) * 2.8 + rng.normal(0, 2)), 3),
                "food_spend_ratio": round(float(0.18 + (idx % 9) * 0.025 + cluster * 0.015), 3),
                "resident_population_total": int(17000 + resident_boost + (idx % 19) * 950),
                "worker_population_total": int(9000 + worker_boost + (idx % 23) * 1100),
                "living_population_total": int(42000 + resident_boost + worker_boost + leisure_boost + (idx % 29) * 1300),
                "subway_peak_boarding": int(9000 + leisure_boost + (idx % 31) * 1200),
                "subway_peak_alighting": int(8500 + leisure_boost + (idx % 27) * 1250),
                "facility_total_count": int(32 + cluster * 18 + (idx % 33)),
                "hospital_count": int(2 + (idx % 9) + (4 if borough == "강남구" else 0)),
                "school_count": int(1 + (idx % 8) + (4 if borough in {"성북구", "종로구"} else 0)),
                "apartment_household_count": int(2200 + resident_boost / 4 + (idx % 37) * 160),
                "apartment_avg_price_million_krw": round(float(520 + rent_boost * 22 + (idx % 16) * 35), 3),
                "store_count": int(22 + cluster * 8 + (idx % 41)),
                "franchise_store_count": int(3 + cluster * 3 + (idx % 19)),
                "opening_store_count": int(1 + (idx % 9)),
                "closing_store_count": int(1 + ((idx + cluster) % 8)),
                "rent_per_sqm_thousand_krw": round(float(34 + rent_boost + (idx % 11) * 2.4), 3),
                "vacancy_rate": round(float(3.8 + (idx % 10) * 0.65 + cluster * 0.35), 3),
            }
        )
    return pd.DataFrame(records)


def train_and_save() -> dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    data = generate_mock_data()
    pipeline = Pipeline([("scaler", StandardScaler()), ("pca", PCA(n_components=8, random_state=SEED))])
    embeddings = pipeline.fit_transform(data[FEATURES])
    index = NearestNeighbors(n_neighbors=12, metric="cosine")
    index.fit(embeddings)
    metric = silhouette_score(embeddings, data["cluster_hint"])
    metadata = {
        "model_type": "pca_nearest_neighbors_embedding",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": int(len(data)),
        "embedding_dimensions": 8,
        "features": FEATURES,
        "metrics": {"silhouette_by_mock_cluster": round(float(metric), 4)},
        "source_field_map": SOURCE_FIELD_MAP,
        "districts": data.drop(columns=["cluster_hint"]).to_dict("records"),
        "sources": ["https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html", "https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html"],
    }
    joblib.dump({"pipeline": pipeline, "index": index, "embeddings": embeddings, "districts": metadata["districts"]}, MODEL_PATH)
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def load_artifacts() -> tuple[dict[str, Any], dict[str, Any]]:
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        train_and_save()
    return joblib.load(MODEL_PATH), json.loads(METADATA_PATH.read_text(encoding="utf-8"))


if __name__ == "__main__":
    print(json.dumps(train_and_save(), ensure_ascii=False, indent=2))
