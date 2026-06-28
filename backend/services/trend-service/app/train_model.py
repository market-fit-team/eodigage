"""모델 학습 실행 경로: challenger 학습 → champion 비교 → 선택적 승격.

API 서버와 배치 예측은 이 모듈을 호출하지 않는다(학습/추론 분리).
대상 모델은 검증된 forward-slope 예측 모델(세그먼트별 부스터 + 공통 메타)이다.
"""

from __future__ import annotations

import argparse
import json
import os

from app.models.commercial_trend.forecast_features import TREND_WEEKS
from app.models.commercial_trend.paths import forecast_meta_file, forecast_model_file


def _rank_ic(meta: dict[str, object] | None) -> float | None:
    """검증 메타에서 순위상관(rank IC)을 꺼낸다(승격 게이트 지표)."""
    if not meta:
        return None
    validation = meta.get("validation")
    if not isinstance(validation, dict) or validation.get("rank_ic") is None:
        return None
    return float(validation["rank_ic"])


def _load_meta(suffix: str = "") -> dict[str, object] | None:
    path = forecast_meta_file(suffix)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _should_promote(champion: float | None, challenger: float | None) -> bool:
    """champion이 없으면 채택하고, 둘 다 있으면 challenger가 champion 이상일 때만 승격한다."""
    if champion is None:
        return True
    if challenger is None:
        return False
    return challenger >= champion


def _promote_bundle(suffix: str) -> None:
    """챌린저 부스터(세그먼트별)와 메타를 champion 경로로 원자적 교체한다."""
    for segment in TREND_WEEKS:
        challenger = forecast_model_file(segment, suffix)
        if challenger.exists():
            os.replace(challenger, forecast_model_file(segment))
    os.replace(forecast_meta_file(suffix), forecast_meta_file())


def train_challenger(data_mode: str = "db", promote: bool = False) -> dict[str, object]:
    """challenger를 임시 artifact로 학습하고, 게이트를 통과한 경우에만 선택적으로 champion에 반영한다."""
    from app.models.commercial_trend.forecast_train import train_forecast

    suffix = "_challenger"
    new_meta = train_forecast(data_mode, suffix=suffix)

    champion_skill = _rank_ic(_load_meta())
    challenger_skill = _rank_ic(new_meta)
    gate_passed = _should_promote(champion_skill, challenger_skill)
    promoted = False

    if promote and gate_passed:
        _promote_bundle(suffix)
        promoted = True

    return {
        "model_id": new_meta.get("model_id"),
        "data_mode": data_mode,
        "champion_rank_ic": champion_skill,
        "challenger_rank_ic": challenger_skill,
        "gate_passed": gate_passed,
        "promote_requested": promote,
        "promoted": promoted,
        "validation": new_meta.get("validation"),
        "segments": new_meta.get("segments"),
        "trained_at": new_meta.get("trained_at"),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="forward-slope 트렌드 모델 학습(challenger 생성 및 선택적 승격)")
    parser.add_argument("--data-mode", default="db", choices=["db", "raw", "sample"])
    parser.add_argument("--promote", action="store_true", help="검증 게이트 통과 시 champion artifact로 승격")
    args = parser.parse_args()
    result = train_challenger(data_mode=args.data_mode, promote=args.promote)
    print(json.dumps(result, ensure_ascii=False, indent=2))
