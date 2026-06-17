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
WEIGHTS_PATH = ARTIFACT_DIR / "survey_franchise.weights.h5"
SEED = 51

CATEGORIES = ["coffee", "korean_food", "dessert", "fitness", "fast_food", "salon", "retail"]
DISTRICTS = ["1168064000", "1144066000", "1120069000", "1111065000", "1171063100", "1154563000"]
RISK_LEVELS = ["low", "medium", "high"]
TIME_PREFS = ["morning", "lunch", "evening", "night"]

USER_FIELDS = [
    "survey_id",
    "preferred_category",
    "preferred_district_code",
    "risk_tolerance",
    "preferred_time_band",
    "budget_million_krw",
    "min_monthly_sales_million_krw",
    "max_rent_million_krw",
    "food_spend_preference",
    "footfall_preference",
    "brand_preference",
]
ITEM_FIELDS = [
    "franchise_id",
    "category",
    "district_code",
    "startup_cost_million_krw",
    "avg_sales_million_krw",
    "rent_million_krw",
    "franchise_store_count",
    "closure_rate",
    "brand_power",
    "footfall_index",
]
SOURCE_FIELD_MAP = {
    "preferred_category": "사용자 설문 희망 업종",
    "preferred_district_code": "사용자 설문 희망 행정동",
    "budget_million_krw": "사용자 설문 투자 가능 금액",
    "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 업종별 추정매출",
    "franchise_store_count": "상권분석서비스(점포-행정동) 프랜차이즈 점포 수",
    "closure_rate": "상권분석서비스(점포/상권변화지표-행정동) 폐업 비율",
    "brand_power": "공정거래위원회 브랜드별 가맹점 현황 평균매출 기반 브랜드 지표",
}


def generate_mock_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, str]]]:
    rng = np.random.default_rng(SEED)
    surveys: list[dict[str, Any]] = []
    franchises: list[dict[str, Any]] = []
    for idx in range(160):
        surveys.append(
            {
                "survey_id": f"survey-{idx:03d}",
                "preferred_category": CATEGORIES[(idx + idx // 9) % len(CATEGORIES)],
                "preferred_district_code": DISTRICTS[idx % len(DISTRICTS)],
                "risk_tolerance": RISK_LEVELS[idx % len(RISK_LEVELS)],
                "preferred_time_band": TIME_PREFS[(idx // 4) % len(TIME_PREFS)],
                "budget_million_krw": round(float(80 + (idx % 13) * 28 + rng.normal(0, 4)), 3),
                "min_monthly_sales_million_krw": round(float(35 + (idx % 10) * 6), 3),
                "max_rent_million_krw": round(float(3.5 + (idx % 8) * 0.8), 3),
                "food_spend_preference": round(float(0.18 + (idx % 9) * 0.025), 3),
                "footfall_preference": round(float(0.35 + (idx % 8) * 0.06), 3),
                "brand_preference": round(float(0.2 + (idx % 7) * 0.09), 3),
            }
        )
    for idx in range(180):
        category = CATEGORIES[(idx * 2 + idx // 7) % len(CATEGORIES)]
        district = DISTRICTS[(idx * 3 + idx // 11) % len(DISTRICTS)]
        startup = 65 + (idx % 16) * 24
        rent = 3.2 + (idx % 11) * 0.72 + (1.8 if district == "1168064000" else 0)
        sales = 38 + (idx % 19) * 4.5 + (12 if category in {"coffee", "korean_food"} else 0)
        store_count = 3 + (idx % 24)
        closure = 0.025 + (idx % 12) * 0.012
        brand = min(0.96, 0.28 + (idx % 17) * 0.04 + store_count / 280)
        franchises.append(
            {
                "franchise_id": f"franchise-{idx:03d}",
                "brand_name": f"{category.replace('_', ' ').title()} Fit {idx:03d}",
                "category": category,
                "district_code": district,
                "startup_cost_million_krw": round(float(startup), 3),
                "avg_sales_million_krw": round(float(sales + rng.normal(0, 2)), 3),
                "rent_million_krw": round(float(rent), 3),
                "franchise_store_count": store_count,
                "closure_rate": round(float(closure), 4),
                "brand_power": round(float(brand), 3),
                "footfall_index": round(float(55 + (idx % 27) * 2.7), 3),
            }
        )
    interactions: list[dict[str, str]] = []
    for survey in surveys:
        scored: list[tuple[float, str]] = []
        for item in franchises:
            score = (
                2.4 * float(survey["preferred_category"] == item["category"])
                + 1.3 * float(survey["preferred_district_code"] == item["district_code"])
                - abs(survey["budget_million_krw"] - item["startup_cost_million_krw"]) / 190
                - max(0, item["rent_million_krw"] - survey["max_rent_million_krw"]) * 0.4
                + item["avg_sales_million_krw"] / 110
                + item["brand_power"] * survey["brand_preference"]
                + item["footfall_index"] / 160 * survey["footfall_preference"]
                - item["closure_rate"] * 2.5
                + rng.normal(0, 0.05)
            )
            scored.append((score, item["franchise_id"]))
        scored.sort(reverse=True)
        for _, item_id in scored[:8]:
            interactions.append({"survey_id": survey["survey_id"], "franchise_id": item_id})
    rng.shuffle(interactions)
    return surveys, franchises, interactions


def _num(features: dict[str, tf.Tensor], names: list[str], scales: dict[str, float]) -> tf.Tensor:
    return tf.stack([tf.cast(features[name], tf.float32) / scales[name] for name in names], axis=1)


class SurveyTower(tf.keras.Model):
    def __init__(self, survey_ids: list[str]) -> None:
        super().__init__()
        self.survey_lookup = tf.keras.layers.StringLookup(vocabulary=survey_ids, mask_token=None)
        self.category_lookup = tf.keras.layers.StringLookup(vocabulary=CATEGORIES, mask_token=None)
        self.district_lookup = tf.keras.layers.StringLookup(vocabulary=DISTRICTS, mask_token=None)
        self.risk_lookup = tf.keras.layers.StringLookup(vocabulary=RISK_LEVELS, mask_token=None)
        self.time_lookup = tf.keras.layers.StringLookup(vocabulary=TIME_PREFS, mask_token=None)
        self.survey_embedding = tf.keras.layers.Embedding(len(survey_ids) + 1, 16)
        self.category_embedding = tf.keras.layers.Embedding(len(CATEGORIES) + 1, 12)
        self.district_embedding = tf.keras.layers.Embedding(len(DISTRICTS) + 1, 12)
        self.risk_embedding = tf.keras.layers.Embedding(len(RISK_LEVELS) + 1, 6)
        self.time_embedding = tf.keras.layers.Embedding(len(TIME_PREFS) + 1, 6)
        self.dense = tf.keras.Sequential([tf.keras.layers.Dense(64, activation="relu"), tf.keras.layers.Dense(32)])

    def call(self, f: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _num(
            f,
            ["budget_million_krw", "min_monthly_sales_million_krw", "max_rent_million_krw", "food_spend_preference", "footfall_preference", "brand_preference"],
            {"budget_million_krw": 500, "min_monthly_sales_million_krw": 150, "max_rent_million_krw": 20, "food_spend_preference": 1, "footfall_preference": 1, "brand_preference": 1},
        )
        return self.dense(tf.concat([
            self.survey_embedding(self.survey_lookup(f["survey_id"])),
            self.category_embedding(self.category_lookup(f["preferred_category"])),
            self.district_embedding(self.district_lookup(f["preferred_district_code"])),
            self.risk_embedding(self.risk_lookup(f["risk_tolerance"])),
            self.time_embedding(self.time_lookup(f["preferred_time_band"])),
            numeric,
        ], axis=1))


class ItemTower(tf.keras.Model):
    def __init__(self, item_ids: list[str]) -> None:
        super().__init__()
        self.item_lookup = tf.keras.layers.StringLookup(vocabulary=item_ids, mask_token=None)
        self.category_lookup = tf.keras.layers.StringLookup(vocabulary=CATEGORIES, mask_token=None)
        self.district_lookup = tf.keras.layers.StringLookup(vocabulary=DISTRICTS, mask_token=None)
        self.item_embedding = tf.keras.layers.Embedding(len(item_ids) + 1, 16)
        self.category_embedding = tf.keras.layers.Embedding(len(CATEGORIES) + 1, 12)
        self.district_embedding = tf.keras.layers.Embedding(len(DISTRICTS) + 1, 12)
        self.dense = tf.keras.Sequential([tf.keras.layers.Dense(64, activation="relu"), tf.keras.layers.Dense(32)])

    def call(self, f: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _num(
            f,
            ["startup_cost_million_krw", "avg_sales_million_krw", "rent_million_krw", "franchise_store_count", "closure_rate", "brand_power", "footfall_index"],
            {"startup_cost_million_krw": 500, "avg_sales_million_krw": 180, "rent_million_krw": 20, "franchise_store_count": 100, "closure_rate": 1, "brand_power": 1, "footfall_index": 160},
        )
        return self.dense(tf.concat([
            self.item_embedding(self.item_lookup(f["franchise_id"])),
            self.category_embedding(self.category_lookup(f["category"])),
            self.district_embedding(self.district_lookup(f["district_code"])),
            numeric,
        ], axis=1))


class SurveyFranchiseModel(tfrs.Model):
    def __init__(self, survey_ids: list[str], item_ids: list[str]) -> None:
        super().__init__()
        self.survey_model = SurveyTower(survey_ids)
        self.item_model = ItemTower(item_ids)
        self.task = tfrs.tasks.Retrieval()

    def compute_loss(self, features: dict[str, tf.Tensor], training: bool = False) -> tf.Tensor:
        return self.task(
            self.survey_model({k: features[k] for k in USER_FIELDS}),
            self.item_model({k: features[k] for k in ITEM_FIELDS}),
            compute_metrics=False,
        )


def _rows(interactions: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> dict[str, list[Any]]:
    by_survey = {r["survey_id"]: r for r in surveys}
    by_item = {r["franchise_id"]: r for r in items}
    out = {k: [] for k in USER_FIELDS + ITEM_FIELDS}
    for row in interactions:
        survey = by_survey[row["survey_id"]]
        item = by_item[row["franchise_id"]]
        for k in USER_FIELDS:
            out[k].append(survey[k])
        for k in ITEM_FIELDS:
            out[k].append(item[k])
    return out


def _dataset(interactions: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> tf.data.Dataset:
    return tf.data.Dataset.from_tensor_slices(_rows(interactions, surveys, items))


def survey_to_tensors(survey: dict[str, Any]) -> dict[str, tf.Tensor]:
    return {k: tf.constant([survey[k]]) for k in USER_FIELDS}


def items_to_tensors(items: list[dict[str, Any]]) -> dict[str, tf.Tensor]:
    return {k: tf.constant([item[k] for item in items]) for k in ITEM_FIELDS}


def _metrics(model: SurveyFranchiseModel, validation: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> dict[str, float]:
    by_survey = {r["survey_id"]: r for r in surveys}
    item_ids = [r["franchise_id"] for r in items]
    item_embeddings = model.item_model(items_to_tensors(items))
    hits = 0
    reciprocal = []
    for row in validation:
        scores = tf.linalg.matmul(model.survey_model(survey_to_tensors(by_survey[row["survey_id"]])), item_embeddings, transpose_b=True)[0].numpy()
        ranked = [item_ids[i] for i in np.argsort(scores)[::-1]]
        rank = ranked.index(row["franchise_id"]) + 1
        hits += int(rank <= 5)
        reciprocal.append(1 / rank)
    return {"hit_rate_at_5": round(hits / len(validation), 4), "mean_reciprocal_rank": round(float(np.mean(reciprocal)), 4), "validation_interactions": float(len(validation))}


def train_and_save(epochs: int = 18) -> dict[str, Any]:
    tf.keras.utils.set_random_seed(SEED)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    surveys, items, interactions = generate_mock_data()
    split = int(len(interactions) * 0.82)
    train_rows, validation_rows = interactions[:split], interactions[split:]
    model = SurveyFranchiseModel(sorted({r["survey_id"] for r in surveys}), sorted({r["franchise_id"] for r in items}))
    model.compile(optimizer=tf.keras.optimizers.Adagrad(0.12))
    model.fit(_dataset(train_rows, surveys, items).shuffle(2048, seed=SEED).batch(64), epochs=epochs, verbose=0)
    _ = model.survey_model(survey_to_tensors(surveys[0]))
    _ = model.item_model(items_to_tensors([items[0]]))
    model.save_weights(WEIGHTS_PATH)
    metadata = {
        "model_type": "survey_franchise_two_tower_retrieval",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "epochs": epochs,
        "mock_rows": {"surveys": len(surveys), "franchises": len(items), "interactions": len(interactions)},
        "metrics": _metrics(model, validation_rows, surveys, items),
        "source_field_map": SOURCE_FIELD_MAP,
        "surveys": surveys,
        "franchises": items,
        "sources": ["https://www.tensorflow.org/recommenders/examples/basic_retrieval", "https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do", "https://www.data.go.kr/data/15110241/openapi.do"],
    }
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def load_metadata() -> dict[str, Any]:
    if not METADATA_PATH.exists() or not WEIGHTS_PATH.exists():
        return train_and_save()
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def load_model() -> tuple[SurveyFranchiseModel, dict[str, Any]]:
    metadata = load_metadata()
    model = SurveyFranchiseModel(sorted({r["survey_id"] for r in metadata["surveys"]}), sorted({r["franchise_id"] for r in metadata["franchises"]}))
    _ = model.survey_model(survey_to_tensors(metadata["surveys"][0]))
    _ = model.item_model(items_to_tensors([metadata["franchises"][0]]))
    model.load_weights(WEIGHTS_PATH)
    return model, metadata


if __name__ == "__main__":
    print(json.dumps(train_and_save(), ensure_ascii=False, indent=2))
