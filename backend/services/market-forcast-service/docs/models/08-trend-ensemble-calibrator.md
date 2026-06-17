# 08 trend_ensemble_calibrator

## 문제

1~4차 모델 점수를 하나의 종합 trend confidence로 보정한다.

```text
subway score
sales momentum proxy
category opportunity score
demand gap score
-> calibrated trend score
```

## 학습

```text
model = sklearn.GradientBoostingRegressor
```

샘플 실행:

```text
.venv/bin/python -m app.models.trend_ensemble_calibrator.train --data-mode sample
```

결과:

```json
{
  "rows": 5,
  "rmse": 0.089755,
  "mae": 0.08747,
  "r2": -18.440262
}
```

R2가 음수다. 샘플 item이 5개뿐이라 학습 품질은 판단하지 않는다. 이 모델은 raw item catalog에서 1~4차 점수를 통합하는 보정기로 다시 검증한다.

## UI

여러 점수를 하나로 줄여야 하는 화면에서만 쓴다.

```text
종합 트렌드 점수 74
```

상세 화면에서는 원점수도 함께 보여준다.

## artifact

```text
.artifacts/trend_ensemble_calibrator/model.joblib
```

