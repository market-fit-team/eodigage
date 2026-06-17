from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import tensorflow as tf
import tensorflow_recommenders as tfrs

ARTIFACT_DIR = Path(os.getenv("MODEL_DIR", "/app/model-artifacts"))
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
WEIGHTS_PATH = ARTIFACT_DIR / "two_tower.weights.h5"
SEED = 42

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
RISK_LEVELS = ["low", "medium", "high"]
AGE_GROUPS = ["20s", "30s", "40s", "50s", "60plus"]

USER_NUMERIC_FIELDS = [
    "investment_budget_million_krw",
    "preferred_food_spend_ratio",
    "preferred_weekend_ratio",
    "target_resident_population",
    "target_worker_population",
]
CANDIDATE_NUMERIC_FIELDS = [
    "startup_cost_million_krw",
    "avg_sales_million_krw",
    "avg_sales_per_area_million_krw",
    "franchise_store_count",
    "closure_rate",
    "opening_store_count",
    "closing_store_count",
    "subway_peak_ride_count",
    "living_population_total",
    "resident_population_total",
    "worker_population_total",
    "facility_total_count",
    "apartment_avg_price_million_krw",
    "rent_per_sqm_thousand_krw",
    "vacancy_rate",
    "brand_power",
]

SOURCE_FIELD_MAP = {
    "district_code": "상권분석서비스 행정동 코드",
    "district_name": "상권분석서비스 행정동 코드 명",
    "category": "서비스 업종 코드 명",
    "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 당월 매출 금액",
    "food_spend_ratio": "상권분석서비스(소비-행정동) 식료품 소비 비중",
    "resident_population_total": "상권분석서비스(상주인구-행정동) 총 상주인구 수",
    "worker_population_total": "상권분석서비스(직장인구-행정동) 총 직장인구 수",
    "change_indicator": "상권분석서비스(상권변화지표-행정동) 상권 변화 지표",
    "franchise_store_count": "상권분석서비스(점포-행정동) 프랜차이즈 점포 수",
    "facility_total_count": "상권분석서비스(집객시설-행정동) 집객시설 수",
    "apartment_avg_price_million_krw": "상권분석서비스(아파트-행정동) 아파트 평균 가격",
    "subway_peak_ride_count": "서울시 지하철 호선별 역별 시간대별 승하차 인원 정보",
    "avg_sales_per_area_million_krw": "공정거래위원회 브랜드별 가맹점 현황 면적단위 평균매출",
    "startup_cost_million_krw": "공정거래위원회 브랜드별 창업 금액 현황",
}


def _numeric_tensor(features: dict[str, tf.Tensor], names: list[str], scales: dict[str, float]) -> tf.Tensor:
    values = []
    for name in names:
        value = tf.cast(features[name], tf.float32) / scales[name]
        values.append(value)
    return tf.stack(values, axis=1)


class UserTower(tf.keras.Model):
    def __init__(self, user_ids: list[str], district_codes: list[str], categories: list[str]) -> None:
        super().__init__()
        dim = 16
        self.user_lookup = tf.keras.layers.StringLookup(vocabulary=user_ids, mask_token=None)
        self.district_lookup = tf.keras.layers.StringLookup(vocabulary=district_codes, mask_token=None)
        self.category_lookup = tf.keras.layers.StringLookup(vocabulary=categories, mask_token=None)
        self.risk_lookup = tf.keras.layers.StringLookup(vocabulary=RISK_LEVELS, mask_token=None)
        self.age_lookup = tf.keras.layers.StringLookup(vocabulary=AGE_GROUPS, mask_token=None)
        self.user_embedding = tf.keras.layers.Embedding(len(user_ids) + 1, dim)
        self.district_embedding = tf.keras.layers.Embedding(len(district_codes) + 1, dim)
        self.category_embedding = tf.keras.layers.Embedding(len(categories) + 1, dim)
        self.risk_embedding = tf.keras.layers.Embedding(len(RISK_LEVELS) + 1, 8)
        self.age_embedding = tf.keras.layers.Embedding(len(AGE_GROUPS) + 1, 8)
        self.dense = tf.keras.Sequential(
            [
                tf.keras.layers.Dense(64, activation="relu"),
                tf.keras.layers.Dense(32, activation="relu"),
            ]
        )

    def call(self, features: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _numeric_tensor(
            features,
            USER_NUMERIC_FIELDS,
            {
                "investment_budget_million_krw": 500.0,
                "preferred_food_spend_ratio": 1.0,
                "preferred_weekend_ratio": 1.0,
                "target_resident_population": 50000.0,
                "target_worker_population": 50000.0,
            },
        )
        return self.dense(
            tf.concat(
                [
                    self.user_embedding(self.user_lookup(features["user_id"])),
                    self.district_embedding(self.district_lookup(features["preferred_district_code"])),
                    self.category_embedding(self.category_lookup(features["preferred_category"])),
                    self.risk_embedding(self.risk_lookup(features["risk_tolerance"])),
                    self.age_embedding(self.age_lookup(features["target_age_group"])),
                    numeric,
                ],
                axis=1,
            )
        )


class FranchiseTower(tf.keras.Model):
    def __init__(self, franchise_ids: list[str], district_codes: list[str], categories: list[str]) -> None:
        super().__init__()
        dim = 16
        self.franchise_lookup = tf.keras.layers.StringLookup(vocabulary=franchise_ids, mask_token=None)
        self.district_lookup = tf.keras.layers.StringLookup(vocabulary=district_codes, mask_token=None)
        self.category_lookup = tf.keras.layers.StringLookup(vocabulary=categories, mask_token=None)
        self.franchise_embedding = tf.keras.layers.Embedding(len(franchise_ids) + 1, dim)
        self.district_embedding = tf.keras.layers.Embedding(len(district_codes) + 1, dim)
        self.category_embedding = tf.keras.layers.Embedding(len(categories) + 1, dim)
        self.dense = tf.keras.Sequential(
            [
                tf.keras.layers.Dense(64, activation="relu"),
                tf.keras.layers.Dense(32, activation="relu"),
            ]
        )

    def call(self, features: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _numeric_tensor(
            features,
            CANDIDATE_NUMERIC_FIELDS,
            {
                "startup_cost_million_krw": 600.0,
                "avg_sales_million_krw": 300.0,
                "avg_sales_per_area_million_krw": 30.0,
                "franchise_store_count": 200.0,
                "closure_rate": 1.0,
                "opening_store_count": 80.0,
                "closing_store_count": 80.0,
                "subway_peak_ride_count": 80000.0,
                "living_population_total": 120000.0,
                "resident_population_total": 60000.0,
                "worker_population_total": 70000.0,
                "facility_total_count": 220.0,
                "apartment_avg_price_million_krw": 3000.0,
                "rent_per_sqm_thousand_krw": 180.0,
                "vacancy_rate": 30.0,
                "brand_power": 1.0,
            },
        )
        return self.dense(
            tf.concat(
                [
                    self.franchise_embedding(self.franchise_lookup(features["franchise_id"])),
                    self.district_embedding(self.district_lookup(features["district_code"])),
                    self.category_embedding(self.category_lookup(features["category"])),
                    numeric,
                ],
                axis=1,
            )
        )


class FranchiseTwoTower(tfrs.Model):
    def __init__(self, user_ids: list[str], franchise_ids: list[str], district_codes: list[str]) -> None:
        super().__init__()
        self.user_model = UserTower(user_ids, district_codes, CATEGORIES)
        self.franchise_model = FranchiseTower(franchise_ids, district_codes, CATEGORIES)
        self.task = tfrs.tasks.Retrieval()

    def compute_loss(self, features: dict[str, tf.Tensor], training: bool = False) -> tf.Tensor:
        user_embeddings = self.user_model({name: features[name] for name in USER_FEATURE_FIELDS})
        franchise_embeddings = self.franchise_model(
            {name: features[name] for name in FRANCHISE_FEATURE_FIELDS}
        )
        return self.task(user_embeddings, franchise_embeddings, compute_metrics=False)


USER_FEATURE_FIELDS = [
    "user_id",
    "preferred_category",
    "preferred_district_code",
    "risk_tolerance",
    "target_age_group",
    *USER_NUMERIC_FIELDS,
]
FRANCHISE_FEATURE_FIELDS = [
    "franchise_id",
    "category",
    "district_code",
    *CANDIDATE_NUMERIC_FIELDS,
]


def generate_mock_catalog() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rng = np.random.default_rng(SEED)
    users: list[dict[str, Any]] = []
    franchises: list[dict[str, Any]] = []

    for idx in range(128):
        district_code, _, _ = DISTRICTS[idx % len(DISTRICTS)]
        category = CATEGORIES[(idx * 2 + idx // 11) % len(CATEGORIES)]
        users.append(
            {
                "user_id": f"user-{idx:03d}",
                "preferred_category": category,
                "preferred_district_code": district_code,
                "investment_budget_million_krw": round(float(90 + (idx % 12) * 28 + rng.normal(0, 5)), 3),
                "risk_tolerance": RISK_LEVELS[idx % len(RISK_LEVELS)],
                "target_age_group": AGE_GROUPS[(idx // 3) % len(AGE_GROUPS)],
                "preferred_food_spend_ratio": round(float(0.18 + (idx % 9) * 0.025), 3),
                "preferred_weekend_ratio": round(float(0.28 + (idx % 7) * 0.045), 3),
                "target_resident_population": int(18000 + (idx % 17) * 1400),
                "target_worker_population": int(12000 + (idx % 19) * 1600),
            }
        )

    for idx in range(144):
        district_code, district_name, borough = DISTRICTS[(idx * 3 + idx // 7) % len(DISTRICTS)]
        category = CATEGORIES[(idx + idx // 5) % len(CATEGORIES)]
        store_count = 28 + (idx % 35)
        franchise_count = 4 + (idx % 18)
        opening_count = 2 + (idx % 9)
        closing_count = 1 + ((idx + 3) % 8)
        resident_population = 17000 + (idx % 22) * 1250 + DISTRICTS.index((district_code, district_name, borough)) * 900
        worker_population = 9000 + (idx % 27) * 1450 + (18000 if borough in {"강남구", "마포구"} else 0)
        subway_peak = 9500 + (idx % 31) * 1700 + (16000 if borough in {"강남구", "송파구"} else 0)
        facility_total = 38 + (idx % 45) + (18 if category in {"coffee", "fast_food"} else 0)
        rent = 38 + (idx % 24) * 2.6 + (28 if borough == "강남구" else 0)
        vacancy_rate = 3.8 + (idx % 10) * 0.7 + (2.2 if closing_count > opening_count else 0)
        brand_power = min(0.95, 0.34 + (idx % 17) * 0.035 + franchise_count / 300)
        startup_cost = 65 + (idx % 15) * 24 + (18 if category == "fitness" else 0)
        avg_sales = (
            35
            + subway_peak / 1450
            + worker_population / 2800
            + brand_power * 45
            - rent * 0.13
            - closing_count * 0.45
            + rng.normal(0, 2.4)
        )
        franchises.append(
            {
                "franchise_id": f"brand-{idx:03d}",
                "brand_name": f"{category.replace('_', ' ').title()} Seoul {idx:03d}",
                "company_name": f"{category.title()} Partners {idx % 23:02d}",
                "category": category,
                "district_code": district_code,
                "district_name": district_name,
                "borough": borough,
                "store_count": store_count,
                "franchise_store_count": franchise_count,
                "opening_store_count": opening_count,
                "closing_store_count": closing_count,
                "closure_rate": round(float(closing_count / max(store_count, 1)), 4),
                "startup_cost_million_krw": round(float(startup_cost), 3),
                "avg_sales_million_krw": round(float(max(avg_sales, 10)), 3),
                "avg_sales_per_area_million_krw": round(float(max(avg_sales / (8 + idx % 9), 1)), 3),
                "subway_peak_ride_count": int(subway_peak),
                "living_population_total": int(resident_population + worker_population + subway_peak * 0.35),
                "resident_population_total": int(resident_population),
                "worker_population_total": int(worker_population),
                "facility_total_count": int(facility_total),
                "apartment_avg_price_million_krw": round(float(520 + (idx % 18) * 72 + (900 if borough == "강남구" else 0)), 3),
                "rent_per_sqm_thousand_krw": round(float(rent), 3),
                "vacancy_rate": round(float(vacancy_rate), 3),
                "brand_power": round(float(brand_power), 3),
            }
        )

    return users, franchises


def generate_interactions(
    users: list[dict[str, Any]], franchises: list[dict[str, Any]]
) -> list[dict[str, str]]:
    rng = np.random.default_rng(SEED)
    interactions: list[dict[str, str]] = []
    for user in users:
        scored: list[tuple[float, str]] = []
        for franchise in franchises:
            category_match = user["preferred_category"] == franchise["category"]
            district_match = user["preferred_district_code"] == franchise["district_code"]
            budget_gap = abs(
                user["investment_budget_million_krw"] - franchise["startup_cost_million_krw"]
            )
            demand_fit = (
                franchise["living_population_total"] / 120000
                + franchise["worker_population_total"] / 70000
                + franchise["subway_peak_ride_count"] / 80000
            )
            operation_penalty = franchise["closure_rate"] * 3.2 + franchise["vacancy_rate"] / 20
            score = (
                2.5 * float(category_match)
                + 1.4 * float(district_match)
                + franchise["brand_power"] * 2.1
                + franchise["avg_sales_million_krw"] / 95
                + demand_fit
                - budget_gap / 190.0
                - operation_penalty
                + rng.normal(0, 0.06)
            )
            scored.append((score, franchise["franchise_id"]))
        scored.sort(reverse=True)
        for _, franchise_id in scored[:8]:
            interactions.append({"user_id": user["user_id"], "franchise_id": franchise_id})
    rng.shuffle(interactions)
    return interactions


def _feature_rows(
    interactions: list[dict[str, str]],
    users: list[dict[str, Any]],
    franchises: list[dict[str, Any]],
) -> dict[str, list[Any]]:
    users_by_id = {row["user_id"]: row for row in users}
    franchises_by_id = {row["franchise_id"]: row for row in franchises}
    features: dict[str, list[Any]] = {field: [] for field in USER_FEATURE_FIELDS + FRANCHISE_FEATURE_FIELDS}
    for interaction in interactions:
        user = users_by_id[interaction["user_id"]]
        franchise = franchises_by_id[interaction["franchise_id"]]
        for field in USER_FEATURE_FIELDS:
            features[field].append(user[field])
        for field in FRANCHISE_FEATURE_FIELDS:
            features[field].append(franchise[field])
    return features


def _dataset(
    interactions: list[dict[str, str]],
    users: list[dict[str, Any]],
    franchises: list[dict[str, Any]],
) -> tf.data.Dataset:
    return tf.data.Dataset.from_tensor_slices(_feature_rows(interactions, users, franchises))


def user_to_tensors(user: dict[str, Any]) -> dict[str, tf.Tensor]:
    return {field: tf.constant([user[field]]) for field in USER_FEATURE_FIELDS}


def franchises_to_tensors(franchises: list[dict[str, Any]]) -> dict[str, tf.Tensor]:
    return {field: tf.constant([row[field] for row in franchises]) for field in FRANCHISE_FEATURE_FIELDS}


def _rank_metrics(
    model: FranchiseTwoTower,
    validation_rows: list[dict[str, str]],
    users: list[dict[str, Any]],
    franchises: list[dict[str, Any]],
) -> dict[str, float]:
    users_by_id = {row["user_id"]: row for row in users}
    franchise_ids = [row["franchise_id"] for row in franchises]
    candidate_embeddings = model.franchise_model(franchises_to_tensors(franchises))
    hits = 0
    reciprocal_ranks: list[float] = []

    for row in validation_rows:
        user_embedding = model.user_model(user_to_tensors(users_by_id[row["user_id"]]))
        scores = tf.linalg.matmul(user_embedding, candidate_embeddings, transpose_b=True)[0].numpy()
        ranked_indices = np.argsort(scores)[::-1]
        ranked_ids = [franchise_ids[idx] for idx in ranked_indices]
        rank = ranked_ids.index(row["franchise_id"]) + 1
        hits += int(rank <= 5)
        reciprocal_ranks.append(1.0 / rank)

    return {
        "hit_rate_at_5": round(hits / max(len(validation_rows), 1), 4),
        "mean_reciprocal_rank": round(float(np.mean(reciprocal_ranks)), 4),
        "validation_interactions": float(len(validation_rows)),
    }


def train_and_save(epochs: int = 18) -> dict[str, Any]:
    tf.keras.utils.set_random_seed(SEED)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    users, franchises = generate_mock_catalog()
    interactions = generate_interactions(users, franchises)
    split_at = int(len(interactions) * 0.82)
    train_rows = interactions[:split_at]
    validation_rows = interactions[split_at:]

    user_ids = sorted({row["user_id"] for row in users})
    franchise_ids = sorted({row["franchise_id"] for row in franchises})
    district_codes = sorted({row[0] for row in DISTRICTS})
    model = FranchiseTwoTower(user_ids=user_ids, franchise_ids=franchise_ids, district_codes=district_codes)
    model.compile(optimizer=tf.keras.optimizers.Adagrad(learning_rate=0.12))
    model.fit(
        _dataset(train_rows, users, franchises).shuffle(2048, seed=SEED).batch(64),
        epochs=epochs,
        verbose=0,
    )

    _ = model.user_model(user_to_tensors(users[0]))
    _ = model.franchise_model(franchises_to_tensors([franchises[0]]))
    model.save_weights(WEIGHTS_PATH)

    metrics = _rank_metrics(model, validation_rows, users, franchises)
    metadata = {
        "model_type": "tensorflow_recommenders_two_tower_retrieval",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "epochs": epochs,
        "train_interactions": len(train_rows),
        "mock_rows": {
            "users": len(users),
            "franchises": len(franchises),
            "interactions": len(interactions),
        },
        "metrics": metrics,
        "source_field_map": SOURCE_FIELD_MAP,
        "users": users,
        "franchises": franchises,
        "sources": [
            "https://www.tensorflow.org/recommenders/examples/quickstart",
            "https://www.tensorflow.org/recommenders/examples/basic_retrieval",
            "https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do",
            "https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do",
            "https://www.data.go.kr/data/15110241/openapi.do",
            "https://www.data.go.kr/data/15110265/openapi.do",
        ],
    }
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def load_metadata() -> dict[str, Any]:
    if not METADATA_PATH.exists() or not WEIGHTS_PATH.exists():
        return train_and_save()
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def load_model() -> tuple[FranchiseTwoTower, dict[str, Any]]:
    metadata = load_metadata()
    user_ids = sorted({row["user_id"] for row in metadata["users"]})
    franchise_ids = sorted({row["franchise_id"] for row in metadata["franchises"]})
    district_codes = sorted({row[0] for row in DISTRICTS})
    model = FranchiseTwoTower(user_ids=user_ids, franchise_ids=franchise_ids, district_codes=district_codes)
    _ = model.user_model(user_to_tensors(metadata["users"][0]))
    _ = model.franchise_model(franchises_to_tensors([metadata["franchises"][0]]))
    model.load_weights(WEIGHTS_PATH)
    return model, metadata


if __name__ == "__main__":
    print(json.dumps(train_and_save(), ensure_ascii=False, indent=2))
