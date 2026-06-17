# 02 sales_momentum_forecast

## 문제

행정동-업종 단위로 다음 분기 트렌드를 예측한다.

```text
output = up | flat | down
```

1차 모델이 만든 `subway_commercial_trend_score`는 외부 유입 선행 신호로 들어간다.

## 구현

2차 모델 코드는 샘플과 raw를 모두 받는다.

```text
app/models/sales_momentum_forecast/features.py
app/models/sales_momentum_forecast/train.py
```

실행:

```text
.venv/bin/python -m app.models.sales_momentum_forecast.train --data-mode sample
.venv/bin/python -m app.models.sales_momentum_forecast.train --data-mode raw
```

`sample`은 `.sample/*.csv`로 smoke training을 실행한다. `raw`는 `.raw/*.csv`에서 실제 다음 분기 매출 성장률을 만들고 30/70 분위수로 `down/flat/up` label을 만든다.

## 가설

다음 분기 상권 트렌드는 최근 매출 momentum, 지하철 하차 신호, 생활인구 변화, 소비 구조가 함께 설명한다.

```text
최근 매출 상승 + 지하철 하차 상승 + 생활인구 상승
-> 다음 분기 up 확률 증가

최근 매출 상승 + 지하철 하차 하락
-> 단기 peak-out 위험 증가

최근 매출 하락 + 지하철 하차 상승
-> 회복 또는 demand gap 후보
```

## 데이터

주 데이터:

```text
estimated_sales_hdong_2025
```

보조 데이터:

```text
consumption_hdong
resident_population_hdong
working_population_hdong
living_population_hdong_domestic
apartment_hdong
attraction_facilities_hdong
subway_commercial_trend_score
```

학습 단위:

```text
행정동_코드
서비스_업종_코드
기준_년분기_코드
```

## 피처

매출 momentum:

```text
sales_amount
sales_count
sales_per_count
sales_qoq_growth
sales_2q_growth
sales_rolling_mean_2q
sales_rolling_std_2q
weekday_sales_ratio
weekend_sales_ratio
lunch_sales_ratio
evening_sales_ratio
night_sales_ratio
male_sales_ratio
female_sales_ratio
age_20_30_sales_ratio
age_40_50_sales_ratio
```

지역 수요:

```text
resident_population_total
worker_population_total
living_population_daily_avg
living_population_night_ratio
consumption_total
food_consumption_ratio
medical_consumption_ratio
education_consumption_ratio
apartment_average_price
apartment_household_count
attraction_facility_count
subway_commercial_trend_score
```

카테고리:

```text
district_code
service_category_code
quarter
```

## 타깃

회귀값:

```text
next_growth = log(next_quarter_sales + 1) - log(current_quarter_sales + 1)
```

분류 라벨:

```text
up = next_growth >= train_period_70_percentile
down = next_growth <= train_period_30_percentile
flat = otherwise
```

threshold는 train 기간에서만 계산한다. valid/test 분포를 보고 threshold를 다시 맞추지 않는다.

현재 코드의 raw mode는 전체 raw frame 분위수로 label을 만든다. 실제 실험 단계에서는 train 기간 분위수로 threshold를 고정하고 valid/test에 적용하도록 바꾼다.

샘플 mode에는 다음 분기 매출이 없으므로 pseudo label을 쓴다.

```text
pseudo =
  0.45 * subway_commercial_trend_score
  + 0.25 * evening_alighting_ratio
  + 0.20 * weekend_sales_ratio
  + 0.10 * lunch_alighting_ratio
```

## 학습

기본 모델:

```text
model = XGBClassifier
objective = multi:softprob
labels = down, flat, up
```

baseline:

```text
baseline_1 = 직전 분기 성장률 부호 반복
baseline_2 = 업종별 train 최빈 label
baseline_3 = sales momentum feature만 사용한 XGBClassifier
```

최종 모델은 baseline_3보다 macro F1과 up top-k precision에서 나아야 한다.

샘플 학습 실행 결과:

```json
{
  "model_type": "xgboost.XGBClassifier",
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "accuracy": 0.625,
  "macro_f1": 0.622222
}
```

샘플 metric은 pseudo label 분류 성능이다. 실제 상권 예측 성능으로 쓰지 않는다.

## 검증

검증 metric:

```text
macro_f1
balanced_accuracy
up_precision_at_20
down_precision_at_20
calibration_brier_score
```

서비스 UI에서 중요한 값은 `up_precision_at_20`이다. “상승 가능 상권 top 20%”를 추천했을 때 실제로 상승한 비율이 중요하다.

검증 질문:

```text
Q1. subway_commercial_trend_score를 넣었을 때 top-k 성능이 개선되는가?
Q2. 업종별 성능 편차가 과도하지 않은가?
Q3. 특정 대형 상권만 계속 up으로 예측하지 않는가?
Q4. 최근 분기 test에서 flat을 과도하게 예측하지 않는가?
```

## 산출 모델

샘플 학습 artifact:

```text
.artifacts/sales_momentum_forecast/model.joblib
.artifacts/sales_momentum_forecast/metadata.json
experiments/02-sales-momentum-forecast/train-result.json
```

raw 테이블 생성 확인:

```text
rows = 49727
quarters = 20251, 20252, 20253
labels = {0: 14918, 1: 19891, 2: 14918}
join_strategy = citywide_quarter_signal
```

예측 출력:

```json
{
  "model_id": "sales_momentum_forecast",
  "area_code": "11200690",
  "service_category_code": "CS100010",
  "trend": "up",
  "confidence": 0.68,
  "probabilities": {
    "down": 0.11,
    "flat": 0.21,
    "up": 0.68
  },
  "expected_growth_band": "5~15%"
}
```

## 해석

`trend=up`은 다음 분기 매출액이 반드시 증가한다는 뜻이 아니다. 과거 유사 행정동-업종 조합과 비교했을 때 상승 라벨에 가까운 feature 패턴이라는 뜻이다.

`confidence`는 softmax probability다. 실제 확률로 UI에 노출하기 전에 calibration을 검증한다.

## UI

상권 상세 카드:

```text
다음 분기 트렌드: 상승 가능
신뢰도: 68
예상 성장 구간: 5~15%
주요 근거: 최근 매출 증가, 저녁 하차 증가, 생활인구 증가
```

업종 리스트:

```text
업종별 상승 가능성 순위
1. 카페 0.74
2. 한식 0.68
3. 디저트 0.61
```

지도 필터:

```text
상승 가능 상권만 보기
하락 위험 상권만 보기
업종 선택
```
