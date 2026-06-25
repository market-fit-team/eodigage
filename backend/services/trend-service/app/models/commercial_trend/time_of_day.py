"""시간대(상업시간/야간) 평균 생활인구. 24시간 합산이 아니라 '평균'이라 실제 동시 인원 단위다.

- 상업시간대(11~21시) 평균: 상권 활성·동시 인원 신호. 인기 섹션과 예측 라벨/피처에 쓴다.
- 야간(0~5시) 평균: 거주 신호. 상업/야간 비율 = '상권성'(상권일수록 크다).
원본 CSV에서 시간대 컬럼(col1=00~23)을 살려 집계한다(기본 파이프라인은 시간을 합산해 버린다).
"""

from __future__ import annotations

import pandas as pd

from app.models.commercial_trend.features import (
    ARTIFACTS_DIR,
    SEGMENT_POSITIONS,
    _living_files,
    _segment_data_dir,
    read_csv_auto,
)

COMMERCIAL_HOURS = {f"{hour:02d}" for hour in range(11, 22)}  # 11~21시
NIGHT_HOURS = {f"{hour:02d}" for hour in range(0, 6)}  # 0~5시

_COMMERCIAL_FILE = ARTIFACTS_DIR / "segment_commercial_dailies.csv.gz"
_NIGHT_FILE = ARTIFACTS_DIR / "segment_night_dailies.csv.gz"

_VALUE_POSITIONS = sorted({pos for positions in SEGMENT_POSITIONS.values() for pos in positions})
_USECOLS = sorted({0, 1, 2, *_VALUE_POSITIONS})


def _build(hours: set[str], data_mode: str) -> dict[str, pd.DataFrame]:
    """원본에서 해당 시간대만 골라 (area, date)별 평균(동시 인원)을 세그먼트별로 만든다."""
    files = _living_files(_segment_data_dir(data_mode))
    if not files:
        raise FileNotFoundError("생활인구 CSV가 없어 시간대 집계를 만들 수 없다")

    parts: list[pd.DataFrame] = []
    for path in files:
        raw = read_csv_auto(path, header=None, skiprows=1, usecols=_USECOLS, dtype=str)
        raw = raw[raw[1].isin(hours)]  # col1=시간대구분(00~23)
        numeric = raw[_VALUE_POSITIONS].apply(pd.to_numeric, errors="coerce")
        record = {"area_code": raw[2].astype(str), "date": raw[0].astype(str)}
        for segment, positions in SEGMENT_POSITIONS.items():
            record[segment] = numeric[positions].sum(axis=1)  # 시간별 세그먼트 인구
        frame = pd.DataFrame(record)
        # (area,date)별 해당 시간대 평균 = 동시 인원
        parts.append(frame.groupby(["area_code", "date"], as_index=False)[list(SEGMENT_POSITIONS)].mean())

    merged = pd.concat(parts, ignore_index=True)
    merged["date"] = pd.to_datetime(merged["date"], format="%Y%m%d")

    def _daily(column: str) -> pd.DataFrame:
        return (
            merged.groupby(["area_code", "date"], as_index=False)[column]
            .mean()
            .rename(columns={column: "population"})
            .sort_values(["area_code", "date"])
        )

    return {segment: _daily(segment) for segment in SEGMENT_POSITIONS}


def _load_or_build(path, hours: set[str], data_mode: str) -> dict[str, pd.DataFrame]:
    if path.exists():
        frame = read_csv_auto(path, dtype={"area_code": str, "segment": str}, parse_dates=["date"])
        return {
            segment: rows.drop(columns=["segment"]).sort_values(["area_code", "date"]).reset_index(drop=True)
            for segment, rows in frame.groupby("segment", sort=False)
        }
    dailies = _build(hours, data_mode)
    snapshot = pd.concat(
        [frame.assign(segment=segment) for segment, frame in dailies.items()], ignore_index=True
    )[["segment", "area_code", "date", "population"]]
    path.parent.mkdir(parents=True, exist_ok=True)
    snapshot.to_csv(path, index=False, compression="gzip")
    return dailies


def load_commercial_dailies(data_mode: str = "db") -> dict[str, pd.DataFrame]:
    """상업시간대(11~21시) 평균 생활인구 일별 시계열(세그먼트별). 없으면 원본에서 만들어 캐시."""
    return _load_or_build(_COMMERCIAL_FILE, COMMERCIAL_HOURS, data_mode)


def load_night_dailies(data_mode: str = "db") -> dict[str, pd.DataFrame]:
    """야간(0~5시) 평균 생활인구 일별 시계열(세그먼트별). 상권성 비율 계산용."""
    return _load_or_build(_NIGHT_FILE, NIGHT_HOURS, data_mode)
