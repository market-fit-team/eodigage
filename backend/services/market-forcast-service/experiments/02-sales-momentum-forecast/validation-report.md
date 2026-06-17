# 02 sales_momentum_forecast validation

## run

샘플 데이터로 학습과 검증을 실행했다.

```text
.venv/bin/python -m app.models.sales_momentum_forecast.train --data-mode sample
```

실행 시각:

```text
2026-06-17T15:22:29.468844+00:00
```

## sample validation

2차 모델은 1차 모델의 sample training frame을 재사용한다. 5개 지하철역 row와 5개 매출 row를 cross join해서 25개 row를 만든다.

```text
training rows = 25
train rows = 17
valid rows = 8
```

샘플 데이터에는 다음 분기 매출 label이 없다. 샘플에서는 아래 pseudo score를 만든 뒤 30/70 분위수로 `down/flat/up` label을 만든다.

```text
pseudo =
  0.45 * subway_commercial_trend_score
  + 0.25 * evening_alighting_ratio
  + 0.20 * weekend_sales_ratio
  + 0.10 * lunch_alighting_ratio
```

샘플 label은 학습 파이프라인 검증용이다.

## metrics

샘플 검증 결과:

```json
{
  "accuracy": 0.625,
  "macro_f1": 0.622222,
  "train_rows": 17,
  "valid_rows": 8
}
```

이 수치는 상권 예측 성능으로 읽지 않는다. pseudo label을 XGBClassifier가 학습하고 artifact를 저장할 수 있는지만 검증한다.

## raw mode

raw mode는 실제 다음 분기 매출 성장률로 label을 만든다.

```text
target_growth = log(next_quarter_sales + 1) - log(current_quarter_sales + 1)
down = bottom 30%
flat = middle 40%
up = top 30%
```

저장 없이 raw 학습 테이블 생성을 확인했다.

```text
rows = 49727
quarters = 20251, 20252, 20253
labels = {0: 14918, 1: 19891, 2: 14918}
join_strategy = citywide_quarter_signal
```

예시 row:

```text
quarter_code area_code service_category_code target_growth trend_label target_score
20251        11110515  CS100001              0.203192      2           0.528535
20252        11110515  CS100001             -0.190766      0           0.509507
20253        11110515  CS100001              0.213250      2           0.529021
```

raw mode는 `station_area_weights.csv`가 없으면 1차 모델과 동일하게 서울 전체 분기 지하철 신호 baseline을 사용한다.

## acceptance

샘플 run의 acceptance는 통과했다.

```text
sample feature frame 생성
pseudo trend_label 생성
XGBClassifier 학습
accuracy/macro_f1 산출
joblib artifact 저장
metadata/train-result 저장
```

아직 통과하지 못한 것은 실제 예측력 검증이다.

```text
raw mode 학습 실행
time-based validation에서 macro_f1 확인
up top-k precision 확인
1차 모델 spatial score 결합 후 성능 개선 확인
```

