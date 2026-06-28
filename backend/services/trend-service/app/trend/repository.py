from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.models import HdongArea, TrendBannerSnapshot, TrendScore
from app.db.session import session_scope

# psycopg 파라미터 한도(65535) 회피용 upsert 청크 크기
_UPSERT_CHUNK = 5000


def is_hdong_area_empty() -> bool:
    with session_scope() as session:
        count = session.scalar(select(func.count()).select_from(HdongArea))
        return (count or 0) == 0


def load_hdong_names_db() -> dict[str, str]:
    with session_scope() as session:
        rows = session.execute(select(HdongArea.code, HdongArea.name)).all()
    return {str(code): str(name) for code, name in rows}


def upsert_hdong_names(names: dict[str, str]) -> int:
    if not names:
        return 0
    payload = [{"code": code, "name": name} for code, name in names.items()]
    statement = pg_insert(HdongArea).values(payload)
    statement = statement.on_conflict_do_update(index_elements=[HdongArea.code], set_={"name": statement.excluded.name})
    with session_scope() as session:
        session.execute(statement)
        session.commit()
    return len(payload)


def save_theme_scores(rankings: dict[str, list[dict[str, object]]], run_at: datetime, as_of_date: date | None) -> int:
    """주제별 예측 결과를 trend_score에 저장한다(run_at 단위 이력, theme로 구분)."""
    payload = [
        {
            "run_at": run_at,
            "theme": theme,
            "area_code": str(item["area_code"]),
            "area_name": str(item["area_name"]),
            "as_of_date": as_of_date,
            "pred_growth": float(item["pred_growth"]),  # type: ignore[arg-type]
            "score": int(item["score"]),  # type: ignore[arg-type]
            "rank": rank,
            "signals": item["signals"],
        }
        for theme, ranking in rankings.items()
        for rank, item in enumerate(ranking, start=1)
    ]
    if not payload:
        return 0
    with session_scope() as session:
        for start in range(0, len(payload), _UPSERT_CHUNK):
            statement = pg_insert(TrendScore).values(payload[start : start + _UPSERT_CHUNK])
            statement = statement.on_conflict_do_nothing(
                index_elements=[TrendScore.run_at, TrendScore.theme, TrendScore.area_code]
            )
            session.execute(statement)
        session.commit()
    return len(payload)


def load_latest_theme_scores() -> dict[str, list[dict[str, object]]]:
    """가장 최근 run_at의 주제별 예측 결과를 {theme: 랭킹}으로 읽는다. 없으면 빈 dict."""
    with session_scope() as session:
        latest = session.scalar(select(func.max(TrendScore.run_at)))
        if latest is None:
            return {}
        rows = (
            session.execute(
                select(TrendScore).where(TrendScore.run_at == latest).order_by(TrendScore.theme, TrendScore.rank)
            )
            .scalars()
            .all()
        )
    result: dict[str, list[dict[str, object]]] = {}
    for row in rows:
        result.setdefault(row.theme, []).append(
            {
                "area_code": row.area_code,
                "area_name": row.area_name,
                "score": row.score,
                "pred_growth": row.pred_growth,
                "signals": row.signals,
            }
        )
    return result


def save_banner_snapshot(
    sections: dict[str, dict[str, list[dict[str, object]]]], run_at: datetime, data_mode: str
) -> None:
    """배너 API가 바로 읽을 수 있는 최종 결과 스냅샷을 저장하고 최신 회차만 남긴다."""
    with session_scope() as session:
        session.add(TrendBannerSnapshot(run_at=run_at, data_mode=data_mode, sections=sections))
        session.execute(delete(TrendBannerSnapshot).where(TrendBannerSnapshot.run_at < run_at))
        session.commit()


def save_prediction_run(
    rankings: dict[str, list[dict[str, object]]],
    sections: dict[str, dict[str, list[dict[str, object]]]],
    run_at: datetime,
    as_of_date: date | None,
    data_mode: str,
) -> int:
    """예측 랭킹과 배너 스냅샷을 같은 회차로 저장하고 이전 회차를 정리한다."""
    score_payload = [
        {
            "run_at": run_at,
            "theme": theme,
            "area_code": str(item["area_code"]),
            "area_name": str(item["area_name"]),
            "as_of_date": as_of_date,
            "pred_growth": float(item["pred_growth"]),  # type: ignore[arg-type]
            "score": int(item["score"]),  # type: ignore[arg-type]
            "rank": rank,
            "signals": item["signals"],
        }
        for theme, ranking in rankings.items()
        for rank, item in enumerate(ranking, start=1)
    ]
    if not score_payload:
        return 0

    with session_scope() as session:
        for start in range(0, len(score_payload), _UPSERT_CHUNK):
            statement = pg_insert(TrendScore).values(score_payload[start : start + _UPSERT_CHUNK])
            statement = statement.on_conflict_do_nothing(
                index_elements=[TrendScore.run_at, TrendScore.theme, TrendScore.area_code]
            )
            session.execute(statement)
        session.add(TrendBannerSnapshot(run_at=run_at, data_mode=data_mode, sections=sections))
        session.execute(delete(TrendScore).where(TrendScore.run_at < run_at))
        session.execute(delete(TrendBannerSnapshot).where(TrendBannerSnapshot.run_at < run_at))
        session.commit()
    return len(score_payload)


def load_latest_banner_snapshot() -> dict[str, dict[str, list[dict[str, object]]]] | None:
    """가장 최근 배너 결과 스냅샷을 읽는다. 없으면 None."""
    with session_scope() as session:
        latest = session.scalar(select(func.max(TrendBannerSnapshot.run_at)))
        if latest is None:
            return None
        row = session.get(TrendBannerSnapshot, latest)
    if row is None:
        return None
    return row.sections  # type: ignore[return-value]


def latest_banner_snapshot_run_at() -> datetime | None:
    """가장 최근 배너 스냅샷 시각을 반환한다."""
    with session_scope() as session:
        return session.scalar(select(func.max(TrendBannerSnapshot.run_at)))


def last_trained_as_of() -> date | None:
    """trend_score에 저장된 최신 예측 기준일. '새 데이터 있는지' 판단에 쓴다."""
    with session_scope() as session:
        return session.scalar(select(func.max(TrendScore.as_of_date)))


def prune_old_runs() -> int:
    """최신 run_at 외의 옛 예측 이력을 삭제한다(무한 누적 방지). 삭제 행수 반환."""
    with session_scope() as session:
        latest = session.scalar(select(func.max(TrendScore.run_at)))
        if latest is None:
            return 0
        result = session.execute(delete(TrendScore).where(TrendScore.run_at < latest))
        session.commit()
        return result.rowcount or 0
