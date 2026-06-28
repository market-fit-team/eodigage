"""생활인구 원본 파싱 검증. 헤더 1칸 밀림(줄 끝 구분자)·세그먼트 합산이 회귀하지 않도록 잠근다."""

from __future__ import annotations

from pathlib import Path

from app.models.commercial_trend import features as F
from app.models.commercial_trend import runtime as R
from app.models.commercial_trend import time_of_day as T

# 남자 14컬럼 + 여자 14컬럼 (실제 LOCAL_PEOPLE_DONG와 동일한 32열 구조)
_MALE_COLS = [f"남자{i}" for i in range(14)]
_FEMALE_COLS = [f"여자{i}" for i in range(14)]
_HEADER = ["기준일ID", "시간대구분", "행정동코드", "총생활인구수"] + _MALE_COLS + _FEMALE_COLS


def _write_living_csv(directory: Path, total: str = "28") -> None:
    """남자=14·여자=14·총합=28인 합성 원본을 만든다. 각 행 끝에 구분자를 붙여 헤더 밀림을 재현."""
    male = ["1"] * 14
    female = ["1"] * 14
    lines = [",".join(_HEADER)]
    for area in ("1111", "2222"):
        for date in ("20260401", "20260402"):
            for hour in ("00", "01"):
                # 4 + 14 + 14 = 32 필드 + 줄 끝 구분자 → 33 필드(실데이터와 동일한 어긋남)
                fields = [date, hour, area, total, *male, *female]
                lines.append(",".join(fields) + ",")
    (directory / "LOCAL_PEOPLE_DONG_TEST.csv").write_text("\n".join(lines), encoding="utf-8")


def test_세그먼트_남여합_전체일치(tmp_path: Path, monkeypatch) -> None:
    """원본 컬럼 위치 합산이 회귀하지 않도록 잠근다: 남성+여성 = 전체."""
    _write_living_csv(tmp_path)
    monkeypatch.setattr(F, "RAW_DIR", tmp_path)
    dailies = T._build({"00", "01"}, "db")  # db 모드는 RAW_DIR을 본다

    assert set(dailies) == {"combined", "male", "female", "youth"}
    assert set(dailies["combined"]["area_code"]) == {"1111", "2222"}
    assert dailies["combined"]["population"].unique().tolist() == [28.0]  # 시간대 평균(동시 인원)
    total = dailies["combined"].set_index(["area_code", "date"])["population"]
    male = dailies["male"].set_index(["area_code", "date"])["population"]
    female = dailies["female"].set_index(["area_code", "date"])["population"]
    assert (male + female - total).abs().max() == 0.0


def test_원천_csv_최신기준일(tmp_path: Path, monkeypatch) -> None:
    _write_living_csv(tmp_path)
    monkeypatch.setattr(F, "RAW_DIR", tmp_path)

    latest = F.latest_source_stat_date("db")
    assert latest is not None
    assert latest.isoformat() == "2026-04-02"


def test_시간대_스냅샷_원천변경시_재생성(tmp_path: Path, monkeypatch) -> None:
    _write_living_csv(tmp_path, total="28")
    cache_path = tmp_path / "time_cache.csv.gz"
    monkeypatch.setattr(F, "RAW_DIR", tmp_path)

    first = T._load_or_build(cache_path, {"00"}, "db")
    assert first["combined"]["population"].unique().tolist() == [28.0]

    _write_living_csv(tmp_path, total="112")
    second = T._load_or_build(cache_path, {"00"}, "db")

    assert second["combined"]["population"].unique().tolist() == [112.0]


def test_db모드_스냅샷없으면_런타임계산하지_않음(monkeypatch) -> None:
    from app.core.config import settings

    def fail_compute(_: str):
        raise AssertionError("런타임에서 원천 계산을 호출하면 안 된다")

    monkeypatch.setattr(settings, "serve_banner_snapshot_from_db", False)
    monkeypatch.setattr(settings, "allow_runtime_banner_compute", False)
    monkeypatch.setattr(R, "_compute_banner_sections", fail_compute)
    monkeypatch.setitem(R._banner_cache, "data", None)
    monkeypatch.setitem(R._banner_cache, "at", 0.0)

    assert R.get_banner_sections("db", use_cache=False) == {"forecast": {}, "popular": {}}
