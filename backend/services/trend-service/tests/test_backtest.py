"""백테스트 헬퍼(순위·시간분할·Top-K) 검증."""

from __future__ import annotations

import numpy as np

from app.models.commercial_trend.backtest import _precision_at_k, _ranks, _time_split


def test_ranks_오름차순_순위() -> None:
    assert _ranks(np.array([10.0, 30.0, 20.0])).tolist() == [0.0, 2.0, 1.0]


def test_time_split_날짜기준_purge갭() -> None:
    n = 20
    features = np.arange(n).reshape(n, 1).astype(float)
    target = np.zeros(n)
    base = np.datetime64("2026-04-01")
    dates = np.array([base + np.timedelta64(i, "D") for i in range(n)])
    x_train, _, x_test, _, d_test = _time_split(features, target, dates, test_fraction=0.25)

    assert len(x_test) == 5  # 마지막 25% as-of일
    assert len(x_train) + len(x_test) < n  # purge로 사이 구간 제외
    # 학습 마지막 일자와 테스트 시작 사이 7일(HORIZON) 이상 간격
    assert (d_test.min() - dates[: len(x_train)].max()) >= np.timedelta64(7, "D")


def test_precision_at_k_완전일치와_불일치() -> None:
    # 한 as-of일에 5개 후보. 예측 순위가 실제 상위와 같으면 P@3=1.0
    date = np.datetime64("2026-05-01")
    dates = np.array([date] * 5)
    y = np.array([5.0, 4.0, 3.0, 2.0, 1.0])
    perfect = np.array([0.5, 0.4, 0.3, 0.2, 0.1])  # y와 동일 순위
    worst = np.array([0.1, 0.2, 0.3, 0.4, 0.5])  # 정반대 순위
    assert _precision_at_k(dates, y, perfect, k=3) == 1.0
    assert _precision_at_k(dates, y, worst, k=3) < 1.0
