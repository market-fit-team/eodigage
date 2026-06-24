"""정기 배치 진입점: (선택)이름 적재 → (새 데이터 시) 챌린저 학습·게이트 → 예측 → 저장.

데이터가 월 단위로만 갱신되므로 상시 실행하지 않는다. 새 달치 CSV를 .raw에 넣은 뒤
`docker exec trend-service python -m app.batch`로 1회 실행한다(필요 시 cron으로 호출).

학습(가끔)과 예측 갱신을 분리한다:
- 새 데이터가 있으면 챌린저를 임시로 학습하고, '챔피언(현 운영 모델)보다 나을 때만' 교체한다.
- 교체 여부와 무관하게 현 챔피언으로 예측을 갱신해 trend_score에 저장한다.

사용:
    python -m app.batch            # 새 데이터 있으면 챌린저 학습·게이트·예측, 없으면 스킵
    python -m app.batch --force    # 새 데이터 여부와 무관하게 실행
    python -m app.batch --ingest   # .raw 행정동 이름 재적재까지 포함
"""

from __future__ import annotations

import argparse
import json
import os

from app.models.commercial_trend.features import META_FILE, MODEL_FILE, latest_source_stat_date
from app.models.commercial_trend.runtime import refresh_theme_rankings
from app.models.commercial_trend.train import train


def _skill(meta: dict[str, object] | None) -> float | None:
    """메타에서 검증 skill_vs_naive(나이브 대비 개선)를 꺼낸다. 없으면 None."""
    if not meta:
        return None
    validation = meta.get("validation")
    if not isinstance(validation, dict) or validation.get("skill_vs_naive") is None:
        return None
    return float(validation["skill_vs_naive"])


def _champion_skill() -> float | None:
    if not META_FILE.exists():
        return None
    from app.models.commercial_trend.predict import load_meta

    try:
        return _skill(load_meta())
    except (FileNotFoundError, ValueError):
        return None


def _should_promote(champion: float | None, challenger: float | None) -> bool:
    """챔피언 없으면 채택, 챌린저 검증 불가면 기존 유지, 둘 다 있으면 챌린저≥챔피언일 때만 교체."""
    if champion is None:
        return True
    if challenger is None:
        return False
    return challenger >= champion


def run_batch(data_mode: str = "db", ingest: bool = False, force: bool = False) -> dict[str, object]:
    if data_mode != "db":
        raise ValueError("배치는 db 모드에서만 동작한다(결과를 DB에 저장하므로).")

    from app.db.session import prepare_database
    from app.trend.repository import last_trained_as_of, prune_old_runs

    prepare_database()  # 테이블 보장 + (비었으면) 행정동 이름 부트스트랩 적재

    if ingest:
        from app.trend.ingest import ingest_bootstrap_into_db

        ingest_bootstrap_into_db()

    # 새 데이터가 없으면(.raw 최신일 <= 마지막 예측 기준일) 건너뛴다.
    source_date = latest_source_stat_date(data_mode)
    last_date = last_trained_as_of()
    if not force and source_date is not None and last_date is not None and source_date <= last_date:
        return {
            "skipped": True,
            "reason": "새 데이터 없음",
            "source_date": str(source_date),
            "last_trained": str(last_date),
        }

    # 챔피언-챌린저: 챌린저를 임시 경로에 학습 → 게이트 통과 시에만 운영 모델 교체.
    challenger_lgb = MODEL_FILE.with_name("challenger.lgb")
    challenger_meta = META_FILE.with_name("challenger.meta.json")
    new_meta = train(data_mode, model_file=challenger_lgb, meta_file=challenger_meta)

    champion = _champion_skill()
    challenger = _skill(new_meta)
    promoted = _should_promote(champion, challenger)
    if promoted:
        os.replace(challenger_lgb, MODEL_FILE)
        os.replace(challenger_meta, META_FILE)
    else:
        challenger_lgb.unlink(missing_ok=True)
        challenger_meta.unlink(missing_ok=True)

    # 학습과 분리: 교체 여부와 무관하게 현 챔피언으로 예측을 갱신한다.
    rankings = refresh_theme_rankings(data_mode)
    pruned = prune_old_runs()

    return {
        "skipped": False,
        "as_of": str(source_date),
        "promoted": promoted,
        "champion_skill": champion,
        "challenger_skill": challenger,
        "trained_samples": new_meta.get("n_samples"),
        "saved_themes": list(rankings),
        "saved_scores": sum(len(ranking) for ranking in rankings.values()),
        "pruned_old_rows": pruned,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="상권 트렌드 배치(챌린저 학습·게이트→예측→저장)")
    parser.add_argument("--data-mode", default="db", choices=["db"])
    parser.add_argument("--ingest", action="store_true", help="실행 전 .raw 행정동 이름 CSV 재적재")
    parser.add_argument("--force", action="store_true", help="새 데이터 여부와 무관하게 실행")
    args = parser.parse_args()
    result = run_batch(args.data_mode, ingest=args.ingest, force=args.force)
    print(json.dumps(result, ensure_ascii=False, indent=2))
