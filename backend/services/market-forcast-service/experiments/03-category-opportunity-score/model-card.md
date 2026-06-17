# category_opportunity_score model card

## model

`category_opportunity_score`는 한 상권 안에서 업종별 기회 점수를 산출한다.

```text
model = XGBRegressor
target = opportunity_score
range = 0..1
```

첫 버전은 회귀 모델이다. 그룹별 ranking 데이터가 충분해지면 `XGBRanker` 전환을 검토한다.

## sample artifact

현재 artifact는 샘플 smoke-training artifact다.

```text
.artifacts/category_opportunity_score/model.joblib
.artifacts/category_opportunity_score/metadata.json
```

학습 결과:

```json
{
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "rmse": 0.091685,
  "mae": 0.07231,
  "r2": 0.909738
}
```

이 metric은 pseudo opportunity score에 대한 적합도다. 실제 업종 추천 성능으로 쓰지 않는다.

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
night_alighting
lunch_alighting_ratio
evening_alighting_ratio
night_alighting_ratio
```

`target_score`는 1차 지하철 유입 점수다.

## output

운영 출력 shape:

```json
{
  "model_id": "category_opportunity_score",
  "area_code": "11110515",
  "categories": [
    {
      "service_category_code": "CS100001",
      "service_category_name": "한식음식점",
      "score": 0.81,
      "rank": 1
    }
  ]
}
```

## not valid for

현재 sample artifact는 아래 용도에 쓰지 않는다.

```text
실제 업종 추천
창업 의사결정
지도/랭킹 UI 운영 표시
```

쓸 수 있는 용도:

```text
업종 점수화 파이프라인 검증
후속 demand_gap_detector 입력 shape 검증
artifact metadata 구조 검증
```

## UI interpretation

raw 모델 검증 후 UI에서는 상권 상세의 “유망 업종” 리스트로 표시한다.

```text
이 상권의 유망 업종
1. 한식음식점 81
2. 양식음식점 74
3. 제과점 69
```

점수는 성공 확률이 아니라 같은 상권 안의 상대적 기회 점수다.

