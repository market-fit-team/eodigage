from __future__ import annotations

import json
from typing import Any

from app.core.paths import ARTIFACT_DIR


def model_artifact_dir(model_id: str) -> str:
    return str(ARTIFACT_DIR / model_id)


def get_artifact_metadata(model_id: str) -> dict[str, Any] | None:
    metadata_path = ARTIFACT_DIR / model_id / "metadata.json"
    if not metadata_path.exists():
        return None
    return json.loads(metadata_path.read_text(encoding="utf-8"))

