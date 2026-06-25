from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import holidays
import numpy as np
import pandas as pd

# 한국 공휴일(음력 환산 포함: 설날·추석·부처님오신날, 대체공휴일). 외부 API 없이 내부 생성.
_KR_HOLIDAYS = holidays.SouthKorea()

# app/models/commercial_trend/features.py -> parents[3] == 서비스 루트
SERVICE_ROOT = Path(__file__).resolve().parents[3]
SAMPLE_DIR = SERVICE_ROOT / ".sample"
RAW_DIR = SERVICE_ROOT / ".raw"
ARTIFACTS_DIR = SERVICE_ROOT / ".artifacts"
# LightGBM 부스터(텍스트 포맷)와 메타데이터(JSON)를 분리 저장한다.
MODEL_FILE = ARTIFACTS_DIR / "commercial_trend.lgb"
META_FILE = ARTIFACTS_DIR / "commercial_trend.meta.json"
SEGMENT_SNAPSHOT_FILE = ARTIFACTS_DIR / "segment_dailies.csv.gz"
SEGMENT_SNAPSHOT_META_FILE = ARTIFACTS_DIR / "segment_dailies.meta.json"
SEGMENT_SNAPSHOT_VERSION = 1

# 월별 생활인구 원본 파일 패턴(예: LOCAL_PEOPLE_DONG_202604.csv). 폴더 내 모든 달치를 읽는다.
LIVING_GLOB = "LOCAL_PEOPLE_DONG_*.csv"
# 구버전 단일 샘플 파일(폴백용)
LIVING_FILE = "living_population_hdong_domestic.sample.csv"
HDONG_NAME_FILE = "hdong_code_name.sample.csv"

# 상권 생활인구는 요일 효과가 커서 최근 4주로 같은 요일을 4번 관측한다.
WINDOW_DAYS = 28
# 배너가 "다음 주" 상권을 말하므로 예측 지평은 1주로 둔다.
HORIZON_DAYS = 7
# 주간 영업 사이클과 주말 효과를 맞춰 보기 위한 단기 비교 단위다.
WEEK_DAYS = 7
# 최근 2주와 직전 2주를 비교해 월중 흐름이 꺾였는지 본다.
MOMENTUM_DAYS = 14

# 모두 생활인구 단일 시계열에서 파생한 피처. 실데이터/다변량(매출·검색량 등)이 들어오면
# compute_window_features에 키를 추가하고 이 목록에 이름만 더하면 파이프라인 전체가 따라온다.
FEATURE_NAMES = [
    "slope_28",  # 28일 추세 기울기(평균 대비)
    "slope_7",  # 최근 7일 추세 기울기(단기)
    "trend_accel",  # 단기-장기 기울기 차(가속/감속)
    "wow_change",  # 최근 7일 대 직전 7일
    "mom_change",  # 최근 14일 대 직전 14일
    "recent_vs_window",  # 최근 7일 대 28일 평균
    "same_weekday_recent",  # 최근 같은 요일들이 과거 같은 요일 평균보다 높은지
    "same_weekday_slope",  # 요일별 4회 관측 추세의 평균
    "volatility",  # 변동성(표준편차/평균)
    "weekend_ratio",  # 주말/평일 유입 비율
    "forecast_weekend_count",  # 예측 창(다음 7일)의 주말 수
    "forecast_holiday_count",  # 예측 창(다음 7일)의 공휴일 수
]


def read_csv_auto(path: Path, **kwargs: object) -> pd.DataFrame:
    """상권분석 원본은 cp949/euc-kr로 내려오기도 해서 인코딩을 차례로 시도한다."""
    for encoding in ("utf-8-sig", "utf-8", "cp949"):
        try:
            return pd.read_csv(path, encoding=encoding, **kwargs)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, **kwargs)


def _data_dir(data_mode: str) -> Path:
    if data_mode == "sample":
        return SAMPLE_DIR
    if data_mode == "raw":
        return RAW_DIR
    raise ValueError("data_mode must be 'sample' or 'raw'")


def load_hdong_names_csv(path: Path) -> dict[str, str]:
    """행정동 코드 -> 이름 매핑(CSV). 배너 라벨에 사용한다."""
    if not path.exists():
        return {}
    frame = read_csv_auto(path, dtype=str)
    return dict(zip(frame["행정동코드"].astype(str), frame["행정동명"].astype(str), strict=False))


def _living_files(data_dir: Path) -> list[Path]:
    """data_dir 안의 월별 생활인구 파일 목록. 없으면 구버전 단일 파일로 폴백."""
    files = sorted(data_dir.glob(LIVING_GLOB))
    if files:
        return files
    legacy = data_dir / LIVING_FILE
    return [legacy] if legacy.exists() else []


def _source_signature(files: list[Path]) -> list[dict[str, object]]:
    """스냅샷 유효성 판단용 원천 파일 서명."""
    return [
        {"name": path.name, "size": path.stat().st_size, "mtime_ns": path.stat().st_mtime_ns}
        for path in files
    ]


def _snapshot_meta(files: list[Path]) -> dict[str, object]:
    return {
        "version": SEGMENT_SNAPSHOT_VERSION,
        "source": _source_signature(files),
        "segments": list(SEGMENT_POSITIONS),
    }


def _read_fresh_snapshot_meta(files: list[Path]) -> dict[str, object] | None:
    if not SEGMENT_SNAPSHOT_FILE.exists() or not SEGMENT_SNAPSHOT_META_FILE.exists():
        return None
    try:
        meta = json.loads(SEGMENT_SNAPSHOT_META_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    expected = _snapshot_meta(files)
    if (
        meta.get("version") != expected["version"]
        or meta.get("source") != expected["source"]
        or meta.get("segments") != expected["segments"]
    ):
        return None
    return meta


def _load_segment_snapshot(files: list[Path]) -> dict[str, pd.DataFrame] | None:
    """원천 파일이 그대로면 일별 세그먼트 스냅샷을 읽는다."""
    if _read_fresh_snapshot_meta(files) is None:
        return None
    frame = read_csv_auto(SEGMENT_SNAPSHOT_FILE, dtype={"area_code": str, "segment": str}, parse_dates=["date"])
    return {
        segment: rows.drop(columns=["segment"]).sort_values(["area_code", "date"]).reset_index(drop=True)
        for segment, rows in frame.groupby("segment", sort=False)
    }


def _save_segment_snapshot(dailies: dict[str, pd.DataFrame], files: list[Path], latest_date: date | None) -> None:
    """비싼 원천 CSV 집계를 다음 실행에서 재사용하도록 저장한다."""
    SEGMENT_SNAPSHOT_FILE.parent.mkdir(parents=True, exist_ok=True)
    snapshot = pd.concat(
        [frame.assign(segment=segment) for segment, frame in dailies.items()],
        ignore_index=True,
    )[["segment", "area_code", "date", "population"]]
    snapshot.to_csv(SEGMENT_SNAPSHOT_FILE, index=False, compression="gzip")
    meta = {**_snapshot_meta(files), "latest_source_date": None if latest_date is None else latest_date.isoformat()}
    SEGMENT_SNAPSHOT_META_FILE.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def load_hdong_names(data_mode: str = "sample") -> dict[str, str]:
    """행정동 코드 -> 이름 매핑. data_mode에 따라 CSV 또는 DB에서 읽는다."""
    if data_mode == "db":
        from app.trend.repository import load_hdong_names_db

        return load_hdong_names_db()
    return load_hdong_names_csv(_data_dir(data_mode) / HDONG_NAME_FILE)


def _series_for_area(daily: pd.DataFrame, area_code: str) -> pd.Series:
    rows = daily[daily["area_code"] == area_code]
    return pd.Series(rows["population"].to_numpy(), index=pd.DatetimeIndex(rows["date"]))


def _slope(values: np.ndarray, mean: float) -> float:
    """평균 대비 선형 추세 기울기. 표본이 2개 미만이면 0."""
    if len(values) < 2:
        return 0.0
    x = np.arange(len(values), dtype=float)
    return float(np.polyfit(x, values, 1)[0]) / mean


def _forecast_calendar(asof: pd.Timestamp) -> tuple[int, int]:
    """as-of 다음날부터 HORIZON_DAYS일(예측 창)의 (주말 수, 공휴일 수)."""
    weekend = 0
    holiday = 0
    for offset in range(1, HORIZON_DAYS + 1):
        day = asof + pd.Timedelta(days=offset)
        if day.weekday() >= 5:
            weekend += 1
        if day.date() in _KR_HOLIDAYS:
            holiday += 1
    return weekend, holiday


def compute_window_features(window: pd.Series) -> dict[str, float]:
    """최근 WINDOW_DAYS 구간의 시계열에서 트렌드 피처를 뽑는다."""
    values = window.to_numpy(dtype=float)
    mean = float(values.mean()) or 1.0

    forecast_weekend_count, forecast_holiday_count = _forecast_calendar(window.index[-1])

    slope_28 = _slope(values, mean)
    slope_7 = _slope(values[-WEEK_DAYS:], mean)

    last7 = values[-WEEK_DAYS:]
    prev7 = values[-(WEEK_DAYS * 2) : -WEEK_DAYS]
    last14 = values[-MOMENTUM_DAYS:]
    prev14 = values[-WINDOW_DAYS:-MOMENTUM_DAYS]

    wow_change = float(last7.mean() / (prev7.mean() or 1.0) - 1.0)
    mom_change = float(last14.mean() / (prev14.mean() or 1.0) - 1.0)
    recent_vs_window = float(last7.mean() / mean - 1.0)
    volatility = float(values.std() / mean)

    weekday = window.index.weekday
    same_weekday_ratios: list[float] = []
    same_weekday_slopes: list[float] = []
    for day in range(7):
        same_weekday_values = values[weekday == day]
        if len(same_weekday_values) < 2:
            continue
        prior_mean = float(same_weekday_values[:-1].mean()) or 1.0
        same_weekday_ratios.append(float(same_weekday_values[-1] / prior_mean - 1.0))
        x = np.arange(len(same_weekday_values), dtype=float)
        same_weekday_slopes.append(float(np.polyfit(x, same_weekday_values, 1)[0]) / mean)
    same_weekday_recent = float(np.mean(same_weekday_ratios)) if same_weekday_ratios else 0.0
    same_weekday_slope = float(np.mean(same_weekday_slopes)) if same_weekday_slopes else 0.0

    weekend_vals = values[weekday >= 5]
    weekday_vals = values[weekday < 5]
    if len(weekend_vals) and len(weekday_vals):
        weekend_ratio = float(weekend_vals.mean() / (weekday_vals.mean() or 1.0) - 1.0)
    else:
        weekend_ratio = 0.0

    return {
        "slope_28": slope_28,
        "slope_7": slope_7,
        "trend_accel": slope_7 - slope_28,
        "wow_change": wow_change,
        "mom_change": mom_change,
        "recent_vs_window": recent_vs_window,
        "same_weekday_recent": same_weekday_recent,
        "same_weekday_slope": same_weekday_slope,
        "volatility": volatility,
        "weekend_ratio": weekend_ratio,
        "forecast_weekend_count": float(forecast_weekend_count),
        "forecast_holiday_count": float(forecast_holiday_count),
    }


def build_training_samples(
    data_mode: str = "sample",
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """주제별 세그먼트 시계열을 슬라이딩해 (피처 -> log-uplift) 통합 학습 샘플을 만든다.

    반환: (features, labels, asof_dates, theme_codes)
    - label = log(향후7일평균+1) - log(최근28일평균+1)  (평소 대비 로그 업리프트)
    - theme_code = 주제 범주형 코드(통합/남성/여성/청년). 단일 모델에 함께 학습.
    asof_dates는 각 표본의 기준 시점이며 시간순 검증 분할에 쓴다.
    """
    dailies = load_segment_dailies(data_mode)
    feature_rows: list[list[float]] = []
    labels: list[float] = []
    asof_dates: list[np.datetime64] = []
    theme_codes: list[int] = []

    for theme, daily in dailies.items():
        code = THEME_CODES[theme]
        for area_code in daily["area_code"].unique():
            series = _series_for_area(daily, area_code)
            n = len(series)
            # as-of 시점 t: 과거 WINDOW_DAYS + 향후 HORIZON_DAYS가 모두 존재해야 한다.
            for t in range(WINDOW_DAYS - 1, n - HORIZON_DAYS):
                window = series.iloc[t - WINDOW_DAYS + 1 : t + 1]
                forward = series.iloc[t + 1 : t + 1 + HORIZON_DAYS].to_numpy(dtype=float)
                base = window.to_numpy(dtype=float).mean() or 1.0
                label = float(np.log1p(forward.mean()) - np.log1p(base))

                feats = compute_window_features(window)
                feature_rows.append([feats[name] for name in FEATURE_NAMES])
                labels.append(label)
                asof_dates.append(np.datetime64(series.index[t]))
                theme_codes.append(code)

    return (
        np.asarray(feature_rows, dtype=float),
        np.asarray(labels, dtype=float),
        np.asarray(asof_dates, dtype="datetime64[ns]"),
        np.asarray(theme_codes, dtype=int),
    )


def latest_features_from_daily(daily: pd.DataFrame, names: dict[str, str]) -> pd.DataFrame:
    """주어진 일별 시계열에서 행정동별 최신 시점 피처를 만든다(주제/세그먼트 공용)."""
    rows: list[dict[str, object]] = []
    for area_code in daily["area_code"].unique():
        series = _series_for_area(daily, area_code)
        if len(series) < WINDOW_DAYS:
            continue
        window = series.iloc[-WINDOW_DAYS:]
        feats = compute_window_features(window)
        rows.append(
            {
                "area_code": area_code,
                "area_name": names.get(area_code, area_code),
                **feats,
            }
        )
    return pd.DataFrame(rows)


# ---- 주제(세그먼트)별 시계열 ----
# 생활인구 원본 컬럼 위치로 정의(헤더 밀림 회피). 유동인구 등 다른 데이터는 섞지 않는다.
SEGMENT_POSITIONS: dict[str, list[int]] = {
    "combined": [3],  # 총생활인구
    "male": list(range(4, 18)),  # 남자 전 연령(4~17)
    "female": list(range(18, 32)),  # 여자 전 연령(18~31)
    "youth": [7, 8, 9, 10, 21, 22, 23, 24],  # 남녀 20~39세
}

# 통합 학습용 주제 코드(범주형 피처). load_segment_dailies가 만드는 주제와 일치한다.
THEME_CODES: dict[str, int] = {"combined": 0, "male": 1, "female": 2, "youth": 3}


def _segment_data_dir(data_mode: str) -> Path:
    # 세그먼트 합산은 원본 CSV에서만 가능하다. db 모드도 실데이터 폴더(.raw)를 본다.
    return RAW_DIR if data_mode == "db" else _data_dir(data_mode)


def latest_source_stat_date(data_mode: str = "sample") -> date | None:
    """원천 생활인구 CSV의 최신 기준일. trend_score의 예측 기준일 메타로 저장한다."""
    files = _living_files(_segment_data_dir(data_mode))
    if not files:
        return None
    snapshot_meta = _read_fresh_snapshot_meta(files)
    if snapshot_meta is not None and snapshot_meta.get("latest_source_date"):
        return date.fromisoformat(str(snapshot_meta["latest_source_date"]))

    latest: pd.Timestamp | None = None
    for path in files:
        raw = read_csv_auto(path, header=None, skiprows=1, usecols=[0], dtype=str)
        dates = pd.to_datetime(raw[0].astype(str), format="%Y%m%d", errors="coerce").dropna()
        if dates.empty:
            continue
        current = dates.max()
        latest = current if latest is None else max(latest, current)
    return None if latest is None else latest.date()


def load_segment_dailies(data_mode: str = "sample") -> dict[str, pd.DataFrame]:
    """CSV를 한 번만 읽어 통합/남성/여성/20·30대 일별 시계열을 함께 만든다.

    반환: {segment: DataFrame[area_code, date, population]}
    """
    files = _living_files(_segment_data_dir(data_mode))
    if not files:
        raise FileNotFoundError("생활인구 CSV가 없어 세그먼트를 만들 수 없다")
    if len(files) > 1:
        snapshot = _load_segment_snapshot(files)
        if snapshot is not None:
            return snapshot

    value_positions = sorted({pos for positions in SEGMENT_POSITIONS.values() for pos in positions})
    usecols = sorted({0, 2, *value_positions})

    parts: list[pd.DataFrame] = []
    for path in files:
        raw = read_csv_auto(path, header=None, skiprows=1, usecols=usecols, dtype=str)
        numeric = raw[value_positions].apply(pd.to_numeric, errors="coerce")
        record = {"area_code": raw[2].astype(str), "date": raw[0].astype(str)}
        for segment, positions in SEGMENT_POSITIONS.items():
            record[segment] = numeric[positions].sum(axis=1)
        parts.append(pd.DataFrame(record))

    merged = pd.concat(parts, ignore_index=True)
    merged["date"] = pd.to_datetime(merged["date"], format="%Y%m%d")

    def _daily(frame: pd.DataFrame, column: str) -> pd.DataFrame:
        return (
            frame.groupby(["area_code", "date"], as_index=False)[column]
            .sum()
            .rename(columns={column: "population"})
            .sort_values(["area_code", "date"])
        )

    dailies: dict[str, pd.DataFrame] = {segment: _daily(merged, segment) for segment in SEGMENT_POSITIONS}
    if len(files) > 1:
        latest_date = None if merged.empty else merged["date"].max().date()
        _save_segment_snapshot(dailies, files, latest_date)
    return dailies
