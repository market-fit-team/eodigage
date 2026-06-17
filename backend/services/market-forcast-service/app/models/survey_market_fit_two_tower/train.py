from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.models.survey_market_fit_two_tower.features import SAMPLE_LABELS, build_item_features, build_l0_labels, load_survey_responses

SERVICE_ROOT = Path(__file__).resolve().parents[3]
EXPERIMENT_DIR = SERVICE_ROOT / "experiments" / "05-survey-market-fit-two-tower"
ARTIFACT_DIR = SERVICE_ROOT / ".artifacts" / "survey_market_fit_two_tower"
SEED = 42


def _first(values: Any, default: str = "none") -> str:
    if isinstance(values, list) and values:
        return str(values[0])
    return default


def _tower_frames(data_mode: str) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    labels = build_l0_labels(data_mode=data_mode)
    surveys = load_survey_responses().copy()
    items = build_item_features(data_mode=data_mode).copy()
    surveys["preferred_primary_category"] = surveys["preferred_categories"].apply(_first)
    positives = labels[labels["label"] == 1].merge(surveys, on=["survey_response_id", "user_id"], how="left")
    positives = positives.merge(
        items,
        on=["item_id", "area_code", "area_name", "service_category_code", "service_category_name"],
        how="left",
        suffixes=("", "_item"),
    )
    return positives, surveys, items


def _tensor_dict(frame: pd.DataFrame, columns: list[str]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for column in columns:
        if frame[column].dtype == object:
            result[column] = frame[column].astype(str).to_numpy()
        else:
            result[column] = frame[column].astype("float32").to_numpy()
    return result


def _train_tfrs(data_mode: str) -> dict[str, Any]:
    import tensorflow as tf
    import tensorflow_recommenders as tfrs

    tf.random.set_seed(SEED)
    positives, surveys, items = _tower_frames(data_mode)

    user_string_features = [
        "user_id",
        "budget_band",
        "risk_tolerance",
        "location_preference",
        "growth_vs_stability",
        "owner_experience_level",
        "preferred_primary_category",
    ]
    user_numeric_features = ["subway_dependency", "rent_sensitivity", "competition_tolerance"]
    item_string_features = ["item_id", "area_code", "service_category_code", "subway_coverage_level"]
    item_numeric_features = [
        "sales_amount",
        "sales_per_count",
        "weekend_sales_ratio",
        "evening_sales_ratio",
        "subway_commercial_trend_score",
        "sales_momentum_up_probability",
        "category_opportunity_score",
        "demand_gap_score",
        "startup_cost_million_krw_proxy",
    ]
    item_scales = {
        "sales_amount": 1_000_000_000.0,
        "sales_per_count": 100_000.0,
        "weekend_sales_ratio": 1.0,
        "evening_sales_ratio": 1.0,
        "subway_commercial_trend_score": 1.0,
        "sales_momentum_up_probability": 1.0,
        "category_opportunity_score": 1.0,
        "demand_gap_score": 1.0,
        "startup_cost_million_krw_proxy": 300.0,
    }

    class UserTower(tf.keras.Model):
        def __init__(self) -> None:
            super().__init__()
            self.lookups = {
                name: tf.keras.layers.StringLookup(vocabulary=sorted(surveys[name].astype(str).unique()), mask_token=None)
                for name in user_string_features
            }
            self.embeddings = {
                name: tf.keras.layers.Embedding(len(self.lookups[name].get_vocabulary()) + 1, 8)
                for name in user_string_features
            }
            self.dense = tf.keras.Sequential(
                [
                    tf.keras.layers.Dense(64, activation="relu"),
                    tf.keras.layers.Dense(32),
                ]
            )

        def call(self, features: dict[str, tf.Tensor]) -> tf.Tensor:
            parts = [self.embeddings[name](self.lookups[name](features[name])) for name in user_string_features]
            numeric = [tf.cast(features[name], tf.float32)[:, tf.newaxis] / 5.0 for name in user_numeric_features]
            return self.dense(tf.concat([*parts, *numeric], axis=1))

    class ItemTower(tf.keras.Model):
        def __init__(self) -> None:
            super().__init__()
            self.lookups = {
                name: tf.keras.layers.StringLookup(vocabulary=sorted(items[name].astype(str).unique()), mask_token=None)
                for name in item_string_features
            }
            self.embeddings = {
                name: tf.keras.layers.Embedding(len(self.lookups[name].get_vocabulary()) + 1, 8)
                for name in item_string_features
            }
            self.dense = tf.keras.Sequential(
                [
                    tf.keras.layers.Dense(64, activation="relu"),
                    tf.keras.layers.Dense(32),
                ]
            )

        def call(self, features: dict[str, tf.Tensor]) -> tf.Tensor:
            parts = [self.embeddings[name](self.lookups[name](features[name])) for name in item_string_features]
            numeric = [
                tf.cast(features[name], tf.float32)[:, tf.newaxis] / item_scales[name]
                for name in item_numeric_features
            ]
            return self.dense(tf.concat([*parts, *numeric], axis=1))

    class SurveyMarketTwoTower(tfrs.Model):
        def __init__(self) -> None:
            super().__init__()
            self.user_model = UserTower()
            self.item_model = ItemTower()
            self.task = tfrs.tasks.Retrieval()

        def compute_loss(self, features: dict[str, tf.Tensor], training: bool = False) -> tf.Tensor:
            user_embeddings = self.user_model({name: features[name] for name in [*user_string_features, *user_numeric_features]})
            item_embeddings = self.item_model({name: features[name] for name in [*item_string_features, *item_numeric_features]})
            return self.task(user_embeddings, item_embeddings, compute_metrics=False)

    train_columns = [*user_string_features, *user_numeric_features, *item_string_features, *item_numeric_features]
    dataset = tf.data.Dataset.from_tensor_slices(_tensor_dict(positives, train_columns)).shuffle(
        len(positives), seed=SEED, reshuffle_each_iteration=True
    ).batch(8)

    model = SurveyMarketTwoTower()
    model.compile(optimizer=tf.keras.optimizers.Adagrad(learning_rate=0.05))
    history = model.fit(dataset, epochs=15, verbose=0)

    item_input = _tensor_dict(items, [*item_string_features, *item_numeric_features])
    item_embeddings = model.item_model({name: tf.convert_to_tensor(value) for name, value in item_input.items()}).numpy()
    item_ids = items["item_id"].astype(str).tolist()
    user_input = _tensor_dict(surveys, [*user_string_features, *user_numeric_features])
    user_embeddings = model.user_model({name: tf.convert_to_tensor(value) for name, value in user_input.items()}).numpy()
    scores = user_embeddings @ item_embeddings.T

    labels = pd.read_csv(SAMPLE_LABELS)
    positive_by_user = labels[labels["label"] == 1].groupby("survey_response_id")["item_id"].apply(set).to_dict()
    hit_count = 0
    reciprocal_ranks: list[float] = []
    for user_index, survey_id in enumerate(surveys["survey_response_id"].tolist()):
        ranking = np.argsort(-scores[user_index])
        ranked_item_ids = [item_ids[index] for index in ranking]
        positives_for_user = positive_by_user.get(survey_id, set())
        if set(ranked_item_ids[:3]) & positives_for_user:
            hit_count += 1
        rank_value = 0.0
        for rank, item_id in enumerate(ranked_item_ids, start=1):
            if item_id in positives_for_user:
                rank_value = 1.0 / rank
                break
        reciprocal_ranks.append(rank_value)

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    model.user_model.save_weights(ARTIFACT_DIR / "user_tower.weights.h5")
    model.item_model.save_weights(ARTIFACT_DIR / "item_tower.weights.h5")
    embeddings = items[["item_id", "area_code", "area_name", "service_category_code", "service_category_name"]].copy()
    for dim in range(item_embeddings.shape[1]):
        embeddings[f"embedding_{dim}"] = item_embeddings[:, dim]
    embeddings.to_csv(ARTIFACT_DIR / "item_embeddings.csv", index=False)

    return {
        "epochs": 15,
        "final_loss": round(float(history.history["loss"][-1]), 6),
        "hit_rate_at_3": round(hit_count / len(surveys), 6),
        "mrr": round(float(np.mean(reciprocal_ranks)), 6),
        "embedding_dim": int(item_embeddings.shape[1]),
        "item_count": int(len(items)),
        "positive_training_pairs": int(len(positives)),
    }


def train_and_save(data_mode: str = "sample", use_tfrs: bool = False) -> dict[str, Any]:
    labels = build_l0_labels(data_mode=data_mode)
    positives = int(labels["label"].sum())
    total = int(len(labels))
    tfrs_metrics = _train_tfrs(data_mode) if use_tfrs else None
    metadata: dict[str, Any] = {
        "model_id": "survey_market_fit_two_tower",
        "status": "sample_trained" if use_tfrs else "labels_generated_not_trained",
        "framework_candidate": "TensorFlow Recommenders",
        "data_mode": data_mode,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rows": total,
        "positive_pairs": positives,
        "negative_pairs": total - positives,
        "positive_rate": round(float(labels["label"].mean()), 6),
        "label_path": str(SAMPLE_LABELS.relative_to(SERVICE_ROOT)),
        "reason_not_trained": None if use_tfrs else "Run with --tfrs to execute TensorFlow Recommenders smoke training.",
        "next_command": None if use_tfrs else ".venv/bin/python -m app.models.survey_market_fit_two_tower.train --data-mode sample --tfrs",
    }
    if tfrs_metrics is not None:
        metadata["metrics"] = tfrs_metrics
        metadata["artifact_path"] = {
            "user_tower": ".artifacts/survey_market_fit_two_tower/user_tower.weights.h5",
            "item_tower": ".artifacts/survey_market_fit_two_tower/item_tower.weights.h5",
        }
        metadata["item_embeddings_path"] = ".artifacts/survey_market_fit_two_tower/item_embeddings.csv"
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (EXPERIMENT_DIR / "train-result.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    parser.add_argument("--tfrs", action="store_true", help="Reserved for TensorFlow Recommenders training.")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode, use_tfrs=args.tfrs), ensure_ascii=False, indent=2))
