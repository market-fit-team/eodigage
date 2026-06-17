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
WEIGHTS_PATH = ARTIFACT_DIR / "survey_district.weights.h5"
SEED = 52

CATEGORIES = ["coffee", "korean_food", "dessert", "fitness", "fast_food", "salon", "retail"]
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
RISK_LEVELS = ["low", "medium", "high"]
USER_FIELDS = [
    "survey_id",
    "preferred_category",
    "risk_tolerance",
    "budget_million_krw",
    "rent_sensitivity",
    "footfall_preference",
    "resident_preference",
    "worker_preference",
    "competition_tolerance",
]
ITEM_FIELDS = [
    "district_code",
    "district_name",
    "borough",
    "avg_sales_million_krw",
    "footfall_index",
    "resident_population_total",
    "worker_population_total",
    "facility_total_count",
    "store_count",
    "franchise_store_count",
    "rent_per_sqm_thousand_krw",
    "vacancy_rate",
    "closure_rate",
]
SOURCE_FIELD_MAP = {
    "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 행정동 평균 추정매출",
    "footfall_index": "지하철 승하차/생활인구 결합 유동인구 지표",
    "resident_population_total": "상권분석서비스(상주인구-행정동) 총 상주인구 수",
    "worker_population_total": "상권분석서비스(직장인구-행정동) 총 직장인구 수",
    "facility_total_count": "상권분석서비스(집객시설-행정동) 집객시설 수",
    "rent_per_sqm_thousand_krw": "매장용빌딩 임대료",
}


def generate_mock_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, str]]]:
    rng = np.random.default_rng(SEED)
    surveys = []
    districts = []
    for idx in range(170):
        surveys.append(
            {
                "survey_id": f"survey-{idx:03d}",
                "preferred_category": CATEGORIES[(idx + idx // 8) % len(CATEGORIES)],
                "risk_tolerance": RISK_LEVELS[idx % len(RISK_LEVELS)],
                "budget_million_krw": round(float(75 + (idx % 14) * 26 + rng.normal(0, 5)), 3),
                "rent_sensitivity": round(float(0.2 + (idx % 8) * 0.08), 3),
                "footfall_preference": round(float(0.25 + (idx % 9) * 0.07), 3),
                "resident_preference": round(float(0.18 + (idx % 7) * 0.07), 3),
                "worker_preference": round(float(0.2 + (idx % 6) * 0.08), 3),
                "competition_tolerance": round(float(0.25 + (idx % 8) * 0.07), 3),
            }
        )
    for idx in range(96):
        code, name, borough = DISTRICTS[idx % len(DISTRICTS)]
        rent = 34 + (idx % 18) * 3.1 + (30 if borough == "강남구" else 0)
        stores = 26 + (idx % 45)
        closure = 0.03 + (idx % 12) * 0.013
        districts.append(
            {
                "district_code": f"{code}-{idx // len(DISTRICTS):02d}",
                "district_name": name,
                "borough": borough,
                "avg_sales_million_krw": round(float(45 + (idx % 27) * 3.2 + rng.normal(0, 2.1)), 3),
                "footfall_index": round(float(60 + (idx % 31) * 3.4 + (24 if borough in {"강남구", "송파구"} else 0)), 3),
                "resident_population_total": int(17000 + (idx % 23) * 1300),
                "worker_population_total": int(9000 + (idx % 29) * 1500 + (18000 if borough in {"강남구", "마포구"} else 0)),
                "facility_total_count": int(35 + (idx % 55)),
                "store_count": stores,
                "franchise_store_count": int(4 + (idx % 21)),
                "rent_per_sqm_thousand_krw": round(float(rent), 3),
                "vacancy_rate": round(float(3.8 + (idx % 10) * 0.7), 3),
                "closure_rate": round(float(closure), 4),
            }
        )
    interactions = []
    for survey in surveys:
        scored = []
        for item in districts:
            score = (
                item["avg_sales_million_krw"] / 100
                + item["footfall_index"] / 120 * survey["footfall_preference"]
                + item["resident_population_total"] / 50000 * survey["resident_preference"]
                + item["worker_population_total"] / 60000 * survey["worker_preference"]
                - item["rent_per_sqm_thousand_krw"] / 120 * survey["rent_sensitivity"]
                - item["closure_rate"] * (1.4 - survey["competition_tolerance"])
                + rng.normal(0, 0.04)
            )
            scored.append((score, item["district_code"]))
        scored.sort(reverse=True)
        for _, district_code in scored[:7]:
            interactions.append({"survey_id": survey["survey_id"], "district_code": district_code})
    rng.shuffle(interactions)
    return surveys, districts, interactions


def _num(f: dict[str, tf.Tensor], names: list[str], scales: dict[str, float]) -> tf.Tensor:
    return tf.stack([tf.cast(f[name], tf.float32) / scales[name] for name in names], axis=1)


class SurveyTower(tf.keras.Model):
    def __init__(self, survey_ids: list[str]) -> None:
        super().__init__()
        self.survey_lookup = tf.keras.layers.StringLookup(vocabulary=survey_ids, mask_token=None)
        self.category_lookup = tf.keras.layers.StringLookup(vocabulary=CATEGORIES, mask_token=None)
        self.risk_lookup = tf.keras.layers.StringLookup(vocabulary=RISK_LEVELS, mask_token=None)
        self.survey_embedding = tf.keras.layers.Embedding(len(survey_ids) + 1, 16)
        self.category_embedding = tf.keras.layers.Embedding(len(CATEGORIES) + 1, 12)
        self.risk_embedding = tf.keras.layers.Embedding(len(RISK_LEVELS) + 1, 6)
        self.dense = tf.keras.Sequential([tf.keras.layers.Dense(64, activation="relu"), tf.keras.layers.Dense(32)])

    def call(self, f: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _num(
            f,
            ["budget_million_krw", "rent_sensitivity", "footfall_preference", "resident_preference", "worker_preference", "competition_tolerance"],
            {"budget_million_krw": 500, "rent_sensitivity": 1, "footfall_preference": 1, "resident_preference": 1, "worker_preference": 1, "competition_tolerance": 1},
        )
        return self.dense(tf.concat([
            self.survey_embedding(self.survey_lookup(f["survey_id"])),
            self.category_embedding(self.category_lookup(f["preferred_category"])),
            self.risk_embedding(self.risk_lookup(f["risk_tolerance"])),
            numeric,
        ], axis=1))


class DistrictTower(tf.keras.Model):
    def __init__(self, district_codes: list[str], boroughs: list[str]) -> None:
        super().__init__()
        self.district_lookup = tf.keras.layers.StringLookup(vocabulary=district_codes, mask_token=None)
        self.borough_lookup = tf.keras.layers.StringLookup(vocabulary=boroughs, mask_token=None)
        self.district_embedding = tf.keras.layers.Embedding(len(district_codes) + 1, 16)
        self.borough_embedding = tf.keras.layers.Embedding(len(boroughs) + 1, 8)
        self.dense = tf.keras.Sequential([tf.keras.layers.Dense(64, activation="relu"), tf.keras.layers.Dense(32)])

    def call(self, f: dict[str, tf.Tensor]) -> tf.Tensor:
        numeric = _num(
            f,
            ["avg_sales_million_krw", "footfall_index", "resident_population_total", "worker_population_total", "facility_total_count", "store_count", "franchise_store_count", "rent_per_sqm_thousand_krw", "vacancy_rate", "closure_rate"],
            {"avg_sales_million_krw": 180, "footfall_index": 180, "resident_population_total": 70000, "worker_population_total": 80000, "facility_total_count": 120, "store_count": 120, "franchise_store_count": 80, "rent_per_sqm_thousand_krw": 160, "vacancy_rate": 20, "closure_rate": 1},
        )
        return self.dense(tf.concat([
            self.district_embedding(self.district_lookup(f["district_code"])),
            self.borough_embedding(self.borough_lookup(f["borough"])),
            numeric,
        ], axis=1))


class SurveyDistrictModel(tfrs.Model):
    def __init__(self, survey_ids: list[str], district_codes: list[str], boroughs: list[str]) -> None:
        super().__init__()
        self.survey_model = SurveyTower(survey_ids)
        self.item_model = DistrictTower(district_codes, boroughs)
        self.task = tfrs.tasks.Retrieval()

    def compute_loss(self, features: dict[str, tf.Tensor], training: bool = False) -> tf.Tensor:
        return self.task(self.survey_model({k: features[k] for k in USER_FIELDS}), self.item_model({k: features[k] for k in ITEM_FIELDS}), compute_metrics=False)


def _rows(interactions: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> dict[str, list[Any]]:
    by_survey = {r["survey_id"]: r for r in surveys}
    by_item = {r["district_code"]: r for r in items}
    out = {k: [] for k in USER_FIELDS + ITEM_FIELDS}
    for row in interactions:
        survey = by_survey[row["survey_id"]]
        item = by_item[row["district_code"]]
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


def _metrics(model: SurveyDistrictModel, validation: list[dict[str, str]], surveys: list[dict[str, Any]], items: list[dict[str, Any]]) -> dict[str, float]:
    by_survey = {r["survey_id"]: r for r in surveys}
    item_ids = [r["district_code"] for r in items]
    item_embeddings = model.item_model(items_to_tensors(items))
    hits = 0
    rr = []
    for row in validation:
        scores = tf.linalg.matmul(model.survey_model(survey_to_tensors(by_survey[row["survey_id"]])), item_embeddings, transpose_b=True)[0].numpy()
        ranked = [item_ids[i] for i in np.argsort(scores)[::-1]]
        rank = ranked.index(row["district_code"]) + 1
        hits += int(rank <= 5)
        rr.append(1 / rank)
    return {"hit_rate_at_5": round(hits / len(validation), 4), "mean_reciprocal_rank": round(float(np.mean(rr)), 4), "validation_interactions": float(len(validation))}


def train_and_save(epochs: int = 18) -> dict[str, Any]:
    tf.keras.utils.set_random_seed(SEED)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    surveys, items, interactions = generate_mock_data()
    split = int(len(interactions) * 0.82)
    model = SurveyDistrictModel(sorted({r["survey_id"] for r in surveys}), sorted({r["district_code"] for r in items}), sorted({r["borough"] for r in items}))
    model.compile(optimizer=tf.keras.optimizers.Adagrad(0.12))
    model.fit(_dataset(interactions[:split], surveys, items).shuffle(2048, seed=SEED).batch(64), epochs=epochs, verbose=0)
    _ = model.survey_model(survey_to_tensors(surveys[0]))
    _ = model.item_model(items_to_tensors([items[0]]))
    model.save_weights(WEIGHTS_PATH)
    metadata = {
        "model_type": "survey_district_two_tower_retrieval",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "epochs": epochs,
        "mock_rows": {"surveys": len(surveys), "district_items": len(items), "interactions": len(interactions)},
        "metrics": _metrics(model, interactions[split:], surveys, items),
        "source_field_map": SOURCE_FIELD_MAP,
        "surveys": surveys,
        "districts": items,
        "sources": ["https://www.tensorflow.org/recommenders/examples/basic_retrieval", "https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do", "https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do"],
    }
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def load_metadata() -> dict[str, Any]:
    if not METADATA_PATH.exists() or not WEIGHTS_PATH.exists():
        return train_and_save()
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def load_model() -> tuple[SurveyDistrictModel, dict[str, Any]]:
    metadata = load_metadata()
    model = SurveyDistrictModel(sorted({r["survey_id"] for r in metadata["surveys"]}), sorted({r["district_code"] for r in metadata["districts"]}), sorted({r["borough"] for r in metadata["districts"]}))
    _ = model.survey_model(survey_to_tensors(metadata["surveys"][0]))
    _ = model.item_model(items_to_tensors([metadata["districts"][0]]))
    model.load_weights(WEIGHTS_PATH)
    return model, metadata


if __name__ == "__main__":
    print(json.dumps(train_and_save(), ensure_ascii=False, indent=2))
