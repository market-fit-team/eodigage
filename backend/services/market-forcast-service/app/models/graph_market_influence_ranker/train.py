from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import networkx as nx

from app.models.survey_market_fit_two_tower.features import build_item_features

SERVICE_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = SERVICE_ROOT / ".artifacts" / "graph_market_influence_ranker"
EXPERIMENT_DIR = SERVICE_ROOT / "experiments" / "09-graph-market-influence-ranker"


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    items = build_item_features(data_mode)
    graph = nx.Graph()
    for _, row in items.iterrows():
        area_node = f"area:{row['area_code']}"
        category_node = f"category:{row['service_category_code']}"
        item_node = f"item:{row['item_id']}"
        graph.add_edge(item_node, area_node, weight=1.0 + float(row["subway_commercial_trend_score"]))
        graph.add_edge(item_node, category_node, weight=1.0 + float(row["category_opportunity_score"]))
        graph.add_edge(area_node, category_node, weight=1.0 + float(row["sales_momentum_up_probability"]))
    pagerank = nx.pagerank(graph, weight="weight")
    item_scores = [
        {
            "item_id": node.replace("item:", ""),
            "graph_influence_score": score,
        }
        for node, score in pagerank.items()
        if node.startswith("item:")
    ]
    item_scores = sorted(item_scores, key=lambda row: row["graph_influence_score"], reverse=True)

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)
    (ARTIFACT_DIR / "graph_edges.json").write_text(
        json.dumps(nx.node_link_data(graph, edges="edges"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (ARTIFACT_DIR / "item_scores.json").write_text(json.dumps(item_scores, ensure_ascii=False, indent=2), encoding="utf-8")
    metadata = {
        "model_id": "graph_market_influence_ranker",
        "model_type": "networkx.PageRank",
        "status": "sample_trained" if data_mode == "sample" else "raw_trained",
        "data_mode": data_mode,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "nodes": int(graph.number_of_nodes()),
        "edges": int(graph.number_of_edges()),
        "item_count": int(len(item_scores)),
        "metrics": {
            "top_item_id": item_scores[0]["item_id"] if item_scores else None,
            "top_score": round(float(item_scores[0]["graph_influence_score"]), 6) if item_scores else 0.0,
        },
        "artifact_path": ".artifacts/graph_market_influence_ranker/item_scores.json",
    }
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (EXPERIMENT_DIR / "train-result.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode), ensure_ascii=False, indent=2))

