# 04 demand_gap_detector

## 문제

유입 신호는 강하지만 매출 반응이 아직 약한 상권-업종 조합을 찾는다.

이 모델은 “지금 이미 잘 되는 곳”보다 “수요가 생기고 있는데 매출이 아직 따라오지 않은 곳”을 찾는다.

## 구현

4차 모델 코드는 샘플과 raw를 모두 받는다.

```text
app/models/demand_gap_detector/features.py
app/models/demand_gap_detector/train.py
```

실행:

```text
.venv/bin/python -m app.models.demand_gap_detector.train --data-mode sample
.venv/bin/python -m app.models.demand_gap_detector.train --data-mode raw
```

`sample`은 synthetic gap label로 smoke training을 실행한다. `raw`는 수요 신호와 다음 분기 성장률 반응 차이를 gap으로 만든다.

## 가설

지하철 하차, 생활인구, 소비 여력은 상승했지만 특정 업종 매출이 아직 낮게 반응하는 경우 다음 기간의 잠재 기회가 높다.

```text
inflow_up = true
living_population_up = true
category_sales_growth_low = true
-> demand_gap_score high
```

## 데이터

```text
subway_commercial_trend_score
sales_momentum_forecast
category_opportunity_score
estimated_sales_hdong_2025
living_population_hdong_domestic
consumption_hdong
```

이 모델은 앞 모델들의 산출물을 feature로 사용한다.

```text
subway_score
sales_up_probability
category_opportunity_score
```

## 피처

수요 신호:

```text
subway_score
area_alighting_3m_growth
living_population_3m_growth
consumption_total_growth
weekend_alighting_growth
evening_alighting_growth
```

매출 반응:

```text
category_sales_qoq_growth
category_sales_2q_growth
category_sales_gap_vs_city_category
category_sales_gap_vs_area_average
sales_per_count_growth
```

경쟁/공급 proxy:

```text
category_area_sales_share
category_city_sales_share
small_business_store_count_prior
category_sales_volatility
```

## 타깃

첫 버전은 규칙 기반 target을 만든 뒤 XGBoost가 그 패턴을 일반화하게 한다.

```text
demand_signal = z(subway_score) + z(living_population_growth) + z(consumption_growth)
sales_response = z(category_sales_growth)
gap = demand_signal - sales_response
```

라벨:

```text
high_gap = gap >= train_period_80_percentile
normal = otherwise
```

현재 코드의 raw target:

```text
demand_signal =
  0.45 * minmax(subway_commercial_trend_score)
  + 0.25 * minmax(evening_alighting)
  + 0.20 * minmax(lunch_alighting)
  + 0.10 * minmax(night_alighting)

sales_response = minmax(target_growth)
gap = demand_signal - sales_response
high_gap = gap >= 80th percentile
```

두 번째 버전은 다음 분기 회복 여부를 target으로 둔다.

```text
rebound = current_gap_high and next_growth >= train_period_70_percentile
```

## 학습

첫 버전:

```text
model = XGBClassifier
objective = binary:logistic
label = high_gap
```

baseline:

```text
baseline_1 = subway_score만으로 high_gap 판정
baseline_2 = living_population_growth - sales_growth 규칙
baseline_3 = category_opportunity_score 상위 20%
```

샘플 학습 실행 결과:

```json
{
  "model_type": "xgboost.XGBClassifier",
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "accuracy": 0.75,
  "macro_f1": 0.428571,
  "positive_rate": 0.2
}
```

positive class가 20%라 accuracy보다 macro F1을 우선해서 본다. 샘플 metric은 synthetic label 분류 결과다.

## 검증

검증 metric:

```text
precision_at_20
recall_at_20
average_precision
rebound_rate_top_decile
```

검증 질문:

```text
Q1. top decile gap 후보가 다음 분기 실제로 회복하는가?
Q2. 단순히 현재 매출이 낮은 업종만 뽑지 않는가?
Q3. 지하철역 접근성이 낮은 상권에서 false positive가 많지 않은가?
Q4. 이미 포화된 상권을 opportunity로 오해하지 않는가?
```

## 산출 모델

샘플 학습 artifact:

```text
.artifacts/demand_gap_detector/model.joblib
.artifacts/demand_gap_detector/metadata.json
experiments/04-demand-gap-detector/train-result.json
```

raw 테이블 생성 확인:

```text
rows = 49727
quarters = 20251, 20252, 20253
labels = {0: 39781, 1: 9946}
positive_rate = 0.200012
gap_min = 0.0
gap_max = 1.0
gap_mean = 0.533391
join_strategy = citywide_quarter_signal
```

예측 출력:

```json
{
  "model_id": "demand_gap_detector",
  "area_code": "11200690",
  "service_category_code": "CS100010",
  "gap_score": 0.77,
  "label": "high_gap",
  "signals": {
    "subway_score": 0.81,
    "living_population_growth": 0.12,
    "category_sales_growth": -0.03
  }
}
```

## 해석

`gap_score`는 “잠재 수요 대비 매출 반응 부족”이다. 반드시 좋은 창업 후보라는 뜻이 아니다. 임대료, 경쟁 점포 수, 프랜차이즈 밀도 같은 공급 데이터가 없으면 과대평가될 수 있다.

## UI

상권 탐색 화면에서 “잠재 수요 갭” 필터로 노출한다.

```text
잠재 수요 갭 높음
유입은 증가했지만 이 업종 매출은 아직 반응이 약합니다.
```

차트:

```text
수요 신호 추이
업종 매출 반응 추이
gap score 추이
```

경고 문구:

```text
이 점수는 기회 후보 탐지용입니다. 임대료와 경쟁 점포 데이터를 함께 확인해야 합니다.
```
