# 03 category_opportunity_score

## 문제

한 상권에서 어떤 업종이 상대적으로 유리한지 점수화한다.

```text
input = area_code
output = service_category ranking
```

2차 모델이 “이 업종이 오를까”를 예측한다면, 3차 모델은 “이 상권에서 어떤 업종이 더 좋은 선택인가”를 비교한다.

## 구현

3차 모델 코드는 샘플과 raw를 모두 받는다.

```text
app/models/category_opportunity_score/features.py
app/models/category_opportunity_score/train.py
```

실행:

```text
.venv/bin/python -m app.models.category_opportunity_score.train --data-mode sample
.venv/bin/python -m app.models.category_opportunity_score.train --data-mode raw
```

`sample`은 pseudo opportunity score로 smoke training을 실행한다. `raw`는 다음 분기 성장률을 이용해 상권 내 상대 우위와 도시 전체 업종 대비 우위를 계산한다.

## 가설

상권의 인구 구조, 소비 구조, 시간대별 유입 패턴, 기존 업종 매출 탄력성이 업종별 기회 점수를 설명한다.

```text
저녁/주말 유입 증가 + 음식 지출 비중 높음
-> 외식/디저트 계열 기회 점수 증가

직장인구 높음 + 점심 하차 증가
-> 점심형 음식 업종 점수 증가

상주인구 높음 + 의료/생활용품 지출 비중 높음
-> 생활밀착 업종 점수 증가
```

## 데이터

```text
sales_momentum_forecast output
subway_commercial_trend_score output
consumption_hdong
resident_population_hdong
working_population_hdong
living_population_hdong_domestic
small_business_activity_by_sector
```

`small_business_activity_by_sector`는 업종 prior로 쓴다.

```text
운영점포수
종사자수
평균영업기간
면적당매출액
면적당종사자수
```

## 피처

상권 feature:

```text
subway_score
lunch_alighting_growth
evening_alighting_growth
weekend_alighting_growth
resident_population_total
worker_population_total
living_population_avg
food_consumption_ratio
medical_consumption_ratio
education_consumption_ratio
apartment_price_proxy
facility_count
```

업종 feature:

```text
service_category_code
category_avg_sales_growth
category_sales_volatility
category_store_activity_prior
category_avg_operating_year
category_sales_per_area
```

상권-업종 interaction:

```text
category_area_sales_momentum
category_area_trend_probability_up
category_area_trend_probability_down
category_area_share_in_area
category_area_growth_gap_vs_city_category
```

## 타깃

첫 버전은 ranking target 대신 회귀 target을 만든다.

```text
opportunity_target =
  normalized_next_growth
  + 0.35 * normalized_sales_momentum_up_prob
  - 0.25 * normalized_volatility
```

target은 train 기간에서만 정규화한다.

2차 버전에서 `XGBRanker`로 바꾼다.

```text
group = area_code + quarter_code
label = next_quarter_category_rank_in_area
```

현재 코드의 raw target:

```text
area_avg = mean(target_growth by quarter_code, area_code)
city_category_avg = mean(target_growth by quarter_code, service_category_code)
opportunity_score = minmax((target_growth - area_avg) + 0.5 * (target_growth - city_category_avg))
```

샘플 mode target:

```text
opportunity_score =
  0.36 * subway_commercial_trend_score
  + 0.22 * weekend_sales_ratio
  + 0.22 * evening_alighting_ratio
  + 0.20 * lunch_alighting_ratio
```

## 학습

첫 버전:

```text
model = XGBRegressor
objective = reg:squarederror
```

baseline:

```text
baseline_1 = 서울 전체 업종 평균 성장률 순위
baseline_2 = 현재 상권의 업종 매출액 순위
baseline_3 = sales_momentum_forecast up probability 순위
```

3차 모델은 baseline_3보다 다양성과 설명력이 좋아야 한다. 2차 모델 결과를 그대로 재포장하면 별도 모델로 둘 이유가 없다.

샘플 학습 실행 결과:

```json
{
  "model_type": "xgboost.XGBRegressor",
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "rmse": 0.091685,
  "mae": 0.07231,
  "r2": 0.909738
}
```

샘플 metric은 pseudo opportunity score에 대한 적합도다. 실제 추천 성능으로 쓰지 않는다.

## 검증

검증 metric:

```text
ndcg_at_3
precision_at_3
spearman_rank_corr
category_diversity
```

검증 질문:

```text
Q1. top 3 추천 업종이 다음 분기 실제 성장 top 3와 얼마나 겹치는가?
Q2. 모든 상권에 카페/한식만 추천하지 않는가?
Q3. 상권 유형별 추천 업종이 해석 가능한가?
Q4. 2차 모델 up probability만 정렬한 baseline보다 낫거나 다른 정보를 주는가?
```

## 산출 모델

샘플 학습 artifact:

```text
.artifacts/category_opportunity_score/model.joblib
.artifacts/category_opportunity_score/metadata.json
experiments/03-category-opportunity-score/train-result.json
```

raw 테이블 생성 확인:

```text
rows = 49727
quarters = 20251, 20252, 20253
target_min = 0.0
target_max = 1.0
target_mean = 0.522455
join_strategy = citywide_quarter_signal
```

예측 출력:

```json
{
  "model_id": "category_opportunity_score",
  "area_code": "11200690",
  "quarter_code": 202502,
  "categories": [
    {
      "service_category_code": "CS100010",
      "service_category_name": "카페",
      "score": 0.81,
      "rank": 1,
      "reason_codes": ["weekend_inflow_up", "young_living_population", "category_momentum_up"]
    }
  ]
}
```

## 해석

점수는 창업 성공 확률이 아니다. 같은 상권 안에서 업종을 비교하기 위한 상대 점수다.

```text
0.80 이상: 강한 후보
0.60-0.80: 검토 후보
0.40-0.60: 중립
0.40 미만: 낮은 후보
```

## UI

상권 상세에서 업종 추천 리스트로 표시한다.

```text
이 상권의 유망 업종
1. 카페 81
2. 디저트 74
3. 한식 69
```

각 업종 옆에 근거 chip을 붙인다.

```text
주말 유입 증가
20-30 생활인구 높음
동일 업종 매출 momentum
```

비교 UI:

```text
상권 A 카페 81 vs 상권 B 카페 63
```
