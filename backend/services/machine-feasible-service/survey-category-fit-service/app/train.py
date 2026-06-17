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
WEIGHTS_PATH = ARTIFACT_DIR / "survey_category.weights.h5"
SEED = 53

CATEGORIES = ["coffee", "korean_food", "dessert", "fitness", "fast_food", "salon", "retail", "education", "clinic"]
GOALS = ["low_capital", "high_growth", "stable_cashflow", "family_operation"]
TIME_PREFS = ["morning", "lunch", "evening", "night"]
RISK_LEVELS = ["low", "medium", "high"]
USER_FIELDS = [
    "survey_id",
    "primary_goal",
    "risk_tolerance",
    "preferred_time_band",
    "budget_million_krw",
    "owner_operation_hours",
    "food_interest",
    "service_interest",
    "retail_interest",
    "growth_preference",
]
ITEM_FIELDS = [
    "category_item_id",
    "service_category",
    "capital_intensity",
    "avg_sales_million_krw",
    "margin_rate",
    "closure_rate",
    "franchise_density",
    "weekend_sales_ratio",
    "evening_sales_ratio",
    "operation_complexity",
]
SOURCE_FIELD_MAP = {
    "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 업종별 평균 매출",
    "weekend_sales_ratio": "추정매출-행정동 주말 매출 비중",
    "closure_rate": "상권분석서비스(점포/상권변화지표-행정동) 업종별 폐업 비율",
    "franchise_density": "점포-행정동 업종별 프랜차이즈 점포 밀도",
    "capital_intensity": "공정거래위원회 업종별 창업비용 기반 자본 강도",
}


def generate_mock_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, str]]]:
    rng = np.random.default_rng(SEED)
    surveys = []
    items = []
    for idx in range(150):
        surveys.append(
            {
                "survey_id": f"survey-{idx:03d}",
                "primary_goal": GOALS[idx % len(GOALS)],
                "risk_tolerance": RISK_LEVELS[(idx // 2) % len(RISK_LEVELS)],
                "preferred_time_band": TIME_PREFS[(idx // 5) % len(TIME_PREFS)],
                "budget_million_krw": round(float(60 + (idx % 12) * 32 + rng.normal(0, 4)), 3),
                "owner_operation_hours": round(float(6 + (idx % 8) * 1.2), 3),
                "food_interest": round(float(0.18 + (idx % 9) * 0.07), 3),
                "service_interest": round(float(0.15 + (idx % 8) * 0.07), 3),
                "retail_interest": round(float(0.12 + (idx % 7) * 0.08), 3),
                "growth_preference": round(float(0.2 + (idx % 9) * 0.075), 3),
            }
        )
    for idx in range(126):
        category = CATEGORIES[idx % len(CATEGORIES)]
        capital = 0.2 + (idx % 10) * 0.075 + (0.22 if category in {"fitness", "clinic"} else 0)
        margin = 0.25 + (idx % 9) * 0.025 + (0.06 if category in {"dessert", "salon"} else 0)
        closure = 0.035 + (idx % 13) * 0.011 + (0.035 if category in {"retail", "fast_food"} else 0)
        items.append(
            {
                "category_item_id": f"category-{idx:03d}",
                "service_category": category,
                "capital_intensity": round(float(min(capital, 0.98)), 3),
                "avg_sales_million_krw": round(float(35 + (idx % 22) * 4.8 + rng.normal(0, 2.5)), 3),
                "margin_rate": round(float(min(margin, 0.75)), 3),
                "closure_rate": round(float(min(closure, 0.35)), 4),
                "franchise_density": round(float(0.12 + (idx % 12) * 0.055), 3),
                "weekend_sales_ratio": round(float(0.22 + (idx % 8) * 0.045), 3),
                "evening_sales_ratio": round(float(0.18 + (idx % 7) * 0.05), 3),
                "operation_complexity": round(float(0.18 + (idx % 9) * 0.075), 3),
            }
        )
    interactions = []
    for survey in surveys:
        scored = []
        for item in items:
            category_food = item["service_category"] in {"coffee", "korean_food", "dessert", "fast_food"}
            category_service = item["service_category"] in {"fitness", "salon", "education", "clinic"}
            category_retail = item["service_category"] == "retail"
            score = (
                item["avg_sales_million_krw"] / 120 * survey["growth_preference"]
                + item["margin_rate"] * 1.4
                + float(category_food) * survey["food_interest"]
                + float(category_service) * survey["service_interest"]
                + float(category_retail) * survey["retail_interest"]
                - item["capital_intensity"] * max(0.2, 1 - survey["budget_million_krw"] / 450)
                - item["operation_complexity"] * max(0, 10 - survey["owner_operation_hours"]) / 10
                - item["closure_rate"] * (2.0 if survey["risk_tolerance"] == "low" else 1.0)
                + item["weekend_sales_ratio"] * float(survey["preferred_time_band"] in {"evening", "night"})
                + rng.normal(0, 0.04)
            )
            scored.append((score, item["category_item_id"]))
        scored.sort(reverse=True)
        for _, item_id in scored[:7]:
            interactions.append({"survey_id": survey["survey_id"], "category_item_id": item_id})
    rng.shuffle(interactions)
    return surveys, items, interactions


def _num(f: dict[str, tf.Tensor], names: list[str], scales: dict[str, float]) -> tf.Tensor:
    return tf.stack([tf.cast(f[name], tf.float32) / scales[name] for name in names], axis=1)


class SurveyTower(tf.keras.Model):
    def __init__(self, survey_ids: list[str]) -> None:
        super().__init__()
        self.survey_lookup = tf.keras.layers.StringLookup(vocabulary=survey_ids, mask_token=None)
        self.goal_lookup = tf.keras.layers.StringLookup(vocabulary=GOALS, mask_token=None)
        self.risk_lookup = tf.keras.layers.StringLookup(vocabulary=RISK_LEVELS, mask_token=None)
        self.time_lookup = tf.keras.layers.StringLookup(vocabulary=TIME_PREFS, mask_token=None)
        self.survey_embedding = tf.keras.layers.Embedding(len(survey_ids) + 1, 16)
        self.goal_embedding = tf.keras.layers.Embedding(len(GOALS) + 1, 8)
        self.risk_embedding = tf.keras.layers.Embedding(len(RISK_LEVELS) + 1, 6)
        self.time_embedding = tf.keras.layers.Embedding(len(TIME_PREFS) + 1, 6)
        self.dense = tf.keras.Sequential([tf.keras.layers.Dense(64, activation="relu"), tf.keras.layers.Dense(32)])

    def call(self, f: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _num(
            f,
            ["budget_million_krw", "owner_operation_hours", "food_interest", "service_interest", "retail_interest", "growth_preference"],
            {"budget_million_krw": 500, "owner_operation_hours": 18, "food_interest": 1, "service_interest": 1, "retail_interest": 1, "growth_preference": 1},
        )
        return self.dense(tf.concat([
            self.survey_embedding(self.survey_lookup(f["survey_id"])),
            self.goal_embedding(self.goal_lookup(f["primary_goal"])),
            self.risk_embedding(self.risk_lookup(f["risk_tolerance"])),
            self.time_embedding(self.time_lookup(f["preferred_time_band"])),
            numeric,
        ], axis=1))


class CategoryTower(tf.keras.Model):
    def __init__(self, item_ids: list[str]) -> None:
        super().__init__()
        self.item_lookup = tf.keras.layers.StringLookup(vocabulary=item_ids, mask_token=None)
        self.category_lookup = tf.keras.layers.StringLookup(vocabulary=CATEGORIES, mask_token=None)
        self.item_embedding = tf.keras.layers.Embedding(len(item_ids) + 1, 16)
        self.category_embedding = tf.keras.layers.Embedding(len(CATEGORIES) + 1, 12)
        self.dense = tf.keras.Sequential([tf.keras.layers.Dense(64, activation="relu"), tf.keras.layers.Dense(32)])

    def call(self, f: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _num(
            f,
            ["capital_intensity", "avg_sales_million_krw", "margin_rate", "closure_rate", "franchise_density", "weekend_sales_ratio", "evening_sales_ratio", "operation_complexity"],
            {"capital_intensity": 1, "avg_sales_million_krw": 160, "margin_rate": 1, "closure_rate": 1, "franchise_density": 1, "weekend_sales_ratio": 1, "evening_sales_ratio": 1, "operation_complexity": 1},
        )
        return self.dense(tf.concat([
            self.item_embedding(self.item_lookup(f["category_item_id"])),
            self.category_embedding(self.category_lookup(f["service_category"])),
            numeric,
        ], axis=1))


class SurveyCategoryModel(tfrs.Model):
    def __init__(self, survey_ids: list[str], item_ids: list[str]) -> None:
        super().__init__()
        self.survey_model = SurveyTower(survey_ids)
        self.item_model = CategoryTower(item_ids)
        self.task = tfrs.tasks.Retrieval()

    def compute_loss(self, features: dict[str, tf.Tensor], training: bool = False) -> tf.Tensor:
        return self.task(self.survey_model({k: features[k] for k in USER_FIELDS}), self.item_model({k: features[k] for k in ITEM_FIELDS}), compute_metrics=False)


def _rows(interactions: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> dict[str, list[Any]]:
    by_survey = {r["survey_id"]: r for r in surveys}
    by_item = {r["category_item_id"]: r for r in items}
    out = {k: [] for k in USER_FIELDS + ITEM_FIELDS}
    for row in interactions:
        for k in USER_FIELDS:
            out[k].append(by_survey[row["survey_id"]][k])
        for k in ITEM_FIELDS:
            out[k].append(by_item[row["category_item_id"]][k])
    return out


def _dataset(interactions: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> tf.data.Dataset:
    return tf.data.Dataset.from_tensor_slices(_rows(interactions, surveys, items))


def survey_to_tensors(survey: dict[str, Any]) -> dict[str, tf.Tensor]:
    return {k: tf.constant([survey[k]]) for k in USER_FIELDS}


def items_to_tensors(items: list[dict[str, Any]]) -> dict[str, tf.Tensor]:
    return {k: tf.constant([item[k] for item in items]) for k in ITEM_FIELDS}


def _metrics(model: SurveyCategoryModel, validation: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> dict[str, float]:
    by_survey = {r["survey_id"]: r for r in surveys}
    item_ids = [r["category_item_id"] for r in items]
    item_embeddings = model.item_model(items_to_tensors(items))
    hits = 0
    rr = []
    for row in validation:
        scores = tf.linalg.matmul(model.survey_model(survey_to_tensors(by_survey[row["survey_id"]])), item_embeddings, transpose_b=True)[0].numpy()
        ranked = [item_ids[i] for i in np.argsort(scores)[::-1]]
        rank = ranked.index(row["category_item_id"]) + 1
        hits += int(rank <= 5)
        rr.append(1 / rank)
    return {"hit_rate_at_5": round(hits / len(validation), 4), "mean_reciprocal_rank": round(float(np.mean(rr)), 4), "validation_interactions": float(len(validation))}


def train_and_save(epochs: int = 18) -> dict[str, Any]:
    tf.keras.utils.set_random_seed(SEED)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    surveys, items, interactions = generate_mock_data()
    split = int(len(interactions) * 0.82)
    model = SurveyCategoryModel(sorted({r["survey_id"] for r in surveys}), sorted({r["category_item_id"] for r in items}))
    model.compile(optimizer=tf.keras.optimizers.Adagrad(0.12))
    model.fit(_dataset(interactions[:split], surveys, items).shuffle(2048, seed=SEED).batch(64), epochs=epochs, verbose=0)
    _ = model.survey_model(survey_to_tensors(surveys[0]))
    _ = model.item_model(items_to_tensors([items[0]]))
    model.save_weights(WEIGHTS_PATH)
    metadata = {
        "model_type": "survey_category_two_tower_retrieval",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "epochs": epochs,
        "mock_rows": {"surveys": len(surveys), "category_items": len(items), "interactions": len(interactions)},
        "metrics": _metrics(model, interactions[split:], surveys, items),
        "source_field_map": SOURCE_FIELD_MAP,
        "surveys": surveys,
        "category_items": items,
        "sources": ["https://www.tensorflow.org/recommenders/examples/basic_retrieval", "https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do", "https://www.data.go.kr/data/15110293/openapi.do"],
    }
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def load_metadata() -> dict[str, Any]:
    if not METADATA_PATH.exists() or not WEIGHTS_PATH.exists():
        return train_and_save()
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def load_model() -> tuple[SurveyCategoryModel, dict[str, Any]]:
    metadata = load_metadata()
    model = SurveyCategoryModel(sorted({r["survey_id"] for r in metadata["surveys"]}), sorted({r["category_item_id"] for r in metadata["category_items"]}))
    _ = model.survey_model(survey_to_tensors(metadata["surveys"][0]))
    _ = model.item_model(items_to_tensors([metadata["category_items"][0]]))
    model.load_weights(WEIGHTS_PATH)
    return model, metadata


if __name__ == "__main__":
    print(json.dumps(train_and_save(), ensure_ascii=False, indent=2))
