"""'지금 인기' 상권(서술용, 모델 아님).

예측이 아니라 '실제로 상업시간대에 사람이 많은 상권'을 그대로 보여준다(사실 보고, 검증 불필요).
- 규모: 상업시간대(11~21시) 평균 동시 인원. 24시간 합산이 아니라 평균이라 '명'이 실제 인원이다.
- 상권 활성도: 상업/야간 비율(상권일수록 크다). 주거 밀집동(비율<1)은 상권에서 제외해
  유동인구가 실제로 많은 상권만 노출한다.
"""

from __future__ import annotations

import pandas as pd

from app.models.commercial_trend.time_of_day import load_commercial_dailies, load_night_dailies

# 최근 며칠을 '지금'으로 볼지[주]. 최근 4주 평균으로 한 주 노이즈를 누른다.
RECENT_WEEKS = 4
# 상권 최소 활성도(상업/야간). 1.0 미만이면 낮보다 밤이 많은 순수 주거지라 상권에서 뺀다.
MIN_VITALITY = 1.0
# 노출 후보 수.
TOP_N = 3


def _weekly(daily: pd.DataFrame) -> pd.DataFrame:
    """일별 [area_code,date,population] -> 주별 [week x area_code] (주평균)."""
    frame = daily.copy()
    frame["week"] = frame["date"].dt.to_period("W-SUN").dt.start_time
    return frame.groupby(["week", "area_code"])["population"].mean().unstack("area_code").sort_index()


def _popular_one(commercial: pd.DataFrame, night: pd.DataFrame) -> list[dict[str, object]]:
    """한 세그먼트: 상업시간대 규모 상위 상권(주거지 제외) + 상권 활성도."""
    if len(commercial) < RECENT_WEEKS:
        return []
    recent = commercial.iloc[-RECENT_WEEKS:].mean(axis=0)
    night_recent = night.reindex(columns=commercial.columns).iloc[-RECENT_WEEKS:].mean(axis=0)

    frame = pd.DataFrame({"level": recent, "night": night_recent}).dropna()
    frame = frame[frame["night"] > 0]
    if frame.empty:
        return []
    frame["vitality"] = frame["level"] / frame["night"]  # 상권 활성도(상업/야간)
    frame = frame[frame["vitality"] >= MIN_VITALITY]  # 주거 밀집동 제외
    if frame.empty:
        return []
    frame = frame.sort_values("level", ascending=False)
    return [
        {
            "area_code": str(area),
            "level": float(row["level"]),  # 상업시간대 평균 동시 인원
            "vitality": float(row["vitality"]),
        }
        for area, row in frame.head(TOP_N).iterrows()
    ]


def compute_popularity(data_mode: str = "db") -> dict[str, list[dict[str, object]]]:
    """세그먼트별 '지금 인기 상권'(상업시간대 규모 상위) 상위 N. 키=combined/male/female/youth."""
    commercial = load_commercial_dailies(data_mode)
    night = load_night_dailies(data_mode)
    return {
        segment: _popular_one(_weekly(commercial[segment]), _weekly(night[segment])) for segment in commercial
    }
