# sales_momentum_forecast model card

## model

`sales_momentum_forecast`는 행정동-업종-분기 row를 입력받아 다음 분기 트렌드를 `down`, `flat`, `up`으로 분류한다.

```text
model = XGBClassifier
objective = multi:softprob
classes = down, flat, up
```

## sample artifact

현재 artifact는 샘플 smoke-training artifact다.

```text
.artifacts/sales_momentum_forecast/model.joblib
.artifacts/sales_momentum_forecast/metadata.json
```

학습 결과:

```json
{
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "accuracy": 0.625,
  "macro_f1": 0.622222
}
```

이 metric은 pseudo label 분류 결과다. 운영 성능으로 쓰지 않는다.

## input contract

입력 feature:

```text
sales_amount
sales_count
sales_per_count
weekend_sales_ratio
evening_sales_ratio
target_score
alighting_total
lunch_alighting
evening_alighting
commute_alighting
night_alighting
alighting_boarding_ratio
lunch_alighting_ratio
evening_alighting_ratio
commute_alighting_ratio
night_alighting_ratio
```

`target_score`는 1차 `subway_commercial_trend_score` 출력에 해당한다. 현재 샘플에서는 1차 feature frame 내부 pseudo score다.

## output

운영 출력 shape:

```json
{
  "model_id": "sales_momentum_forecast",
  "area_code": "11110515",
  "service_category_code": "CS100001",
  "trend": "up",
  "confidence": 0.68,
  "probabilities": {
    "down": 0.11,
    "flat": 0.21,
    "up": 0.68
  }
}
```

## not valid for

현재 sample artifact는 아래 용도에 쓰지 않는다.

```text
상권 상세 실제 트렌드 표시
업종 추천
투자/창업 의사결정
운영 API 응답
```

쓸 수 있는 용도:

```text
분류 학습 파이프라인 검증
후속 3차/4차 모델 입력 shape 검증
artifact metadata 구조 검증
```

## UI interpretation

raw 모델 검증 후 UI에서는 업종별 트렌드 badge로 표시한다.

```text
다음 분기 상승 가능
상승 확률 68
주요 신호: 최근 매출 흐름, 지하철 유입, 저녁 시간대 수요
```

`flat`은 “변화 없음”이 아니라 상승/하락 어느 쪽도 강하지 않다는 뜻이다.

