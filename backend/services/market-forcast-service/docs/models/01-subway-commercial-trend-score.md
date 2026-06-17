# 01 subway_commercial_trend_score

## 문제

최근 지하철 하차 흐름이 특정 상권의 단기 활성도에 긍정적인지 점수로 만든다.

이 모델은 최종 매출 예측 모델이 아니다. 상권 주변의 외부 유입 변화가 얼마나 강한지를 나타내는 선행 신호 모델이다.

```text
station ridership
-> station_area_weight
-> area-level alighting features
-> subway_commercial_trend_score
```

## 가설

상권과 가까운 지하철역의 하차 인원 증가율은 단기 상권 활성도의 선행 신호다.

시간대별 하차는 업종별로 의미가 다르다.

```text
07-10 하차 증가: 출근/업무 상권 신호
11-14 하차 증가: 점심 소비 신호
17-21 하차 증가: 저녁 소비 신호
토/일 하차 증가: 목적 방문/여가 상권 신호
```

상권과 역의 관계는 역명 문자열이 아니라 좌표로 연결한다. 같은 역명이 여러 호선에 존재하고, 한 역이 여러 행정동/상권에 영향을 줄 수 있기 때문이다.

## 데이터

현재 보유 데이터:

```text
.raw/서울시 지하철 호선별 역별 시간대별 승하차 인원 정보.csv
.raw/서울시 상권분석서비스(추정매출-행정동)_2025년.csv
```

추가로 붙일 데이터:

```text
서울시 역사마스터 정보
서울시 상권분석서비스(영역-행정동)
서울시 상권분석서비스(영역-상권)
서울시 지하철호선별 역별 승하차 인원 정보
```

현재 매출 데이터가 행정동 기준이므로 첫 학습 단위는 행정동이다. 상권영역 데이터가 들어오면 같은 방식으로 상권 코드까지 확장한다.

## 구현

1차 모델 코드는 샘플과 raw를 모두 받는다.

```text
app/models/subway_commercial_trend_score/features.py
app/models/subway_commercial_trend_score/train.py
```

실행:

```text
.venv/bin/python -m app.models.subway_commercial_trend_score.train --data-mode sample
.venv/bin/python -m app.models.subway_commercial_trend_score.train --data-mode raw
```

`sample`은 `.sample/*.csv`로 smoke training을 실행한다. `raw`는 `.raw/*.csv`를 읽어 다음 분기 매출 성장률 target을 만든다.

raw mode에서 `data/external/station_area_weights.csv`가 있으면 역-행정동/상권 가중치로 지하철 feature를 결합한다. 파일이 없으면 서울 전체 분기 지하철 신호를 붙이는 baseline으로 동작한다.

raw 테이블 생성 확인:

```text
rows = 49727
quarters = 20251, 20252, 20253
join_strategy = citywide_quarter_signal
```

현재 raw mode는 학습까지 실행하지 않았다. sample artifact를 보존하기 위해 raw 검증은 테이블 생성까지만 확인했다.

## station_area_weight

역 좌표와 행정동/상권 폴리곤으로 가중치를 만든다.

```text
station_id
line_name
station_name
area_type         hdong | commercial_area
area_code
distance_m
buffer_m
weight
```

가중치 계산:

```text
candidate = station buffer 800m와 겹치는 area
raw_weight = intersect_area / buffer_area * distance_decay
distance_decay = 1 / (1 + distance_m / 400)
weight = raw_weight / sum(raw_weight per station_id)
```

역 반경은 처음에 800m로 둔다. 500m, 800m, 1000m를 검증에서 비교한다.

현재 코드가 기대하는 weight 파일:

```text
data/external/station_area_weights.csv
```

필수 컬럼:

```text
station_name
line_name
area_code
weight
```

## 피처

역 단위 feature:

```text
station_month_alighting_total
station_month_boarding_total
station_lunch_alighting
station_evening_alighting
station_commute_alighting
station_weekend_alighting
station_lunch_alighting_ratio
station_evening_alighting_ratio
station_weekend_alighting_ratio
station_alighting_mom_growth
station_alighting_3m_growth
station_alighting_volatility_3m
```

행정동/상권 단위 feature:

```text
area_alighting_total = sum(station_alighting_total * weight)
area_lunch_alighting = sum(station_lunch_alighting * weight)
area_evening_alighting = sum(station_evening_alighting * weight)
area_weekend_alighting = sum(station_weekend_alighting * weight)
area_alighting_mom_growth
area_alighting_3m_growth
area_weighted_station_count
area_top_station_weight
```

## 타깃

raw 학습 타깃은 다음 분기 매출 성장률이다.

```text
target_growth = next_period_sales_growth
target_score = minmax(target_growth)
```

`next_period_sales_growth`는 행정동-업종 매출의 다음 분기 성장률이다.

```text
log(next_quarter_sales + 1) - log(current_quarter_sales + 1)
```

업종별 효과가 다르기 때문에 학습 테이블은 행정동-업종-분기 단위다. 지하철 feature는 행정동-분기 feature로 붙는다.

샘플 학습은 다음 분기 매출이 없다. 그래서 샘플에서는 지하철 하차량, 저녁/점심 하차량, 주말 매출 비중, 매출 규모로 만든 pseudo target을 쓴다.

```text
target_score =
  0.42 * minmax(weighted_alighting_total)
  + 0.24 * minmax(weighted_evening_alighting)
  + 0.14 * minmax(weighted_lunch_alighting)
  + 0.10 * minmax(weekend_sales_ratio)
  + 0.10 * minmax(log1p(sales_amount))
```

이 pseudo target은 pipeline smoke test용이다. 상권 예측력 검증용 target이 아니다.

## 학습

기본 모델:

```text
model = XGBRegressor
objective = reg:squarederror
eval_metric = rmse, mae
```

baseline:

```text
baseline_1 = 모든 row에 train 평균 target_score
baseline_2 = area_alighting_3m_growth만 쓰는 LinearRegression
baseline_3 = current_sales_growth만 쓰는 XGBRegressor
```

검증에서 `baseline_3`보다 나아야 한다. 지하철 feature가 매출 momentum만 반복 설명하면 1차 모델로 분리할 의미가 약하다.

샘플 학습 실행 결과:

```json
{
  "model_type": "xgboost.XGBRegressor",
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "rmse": 0.030651,
  "mae": 0.026152,
  "r2": 0.988915
}
```

샘플은 5개 지하철역 row와 5개 매출 row를 cross join한 25행이다. 이 수치는 pseudo target을 재현했다는 의미만 갖는다.

## 검증

검증 질문:

```text
Q1. 지하철 하차 feature만으로 다음 분기 매출 변화율을 baseline보다 잘 설명하는가?
Q2. 점심/저녁/주말 하차 feature가 업종별로 다른 중요도를 갖는가?
Q3. 500m, 800m, 1000m 중 어떤 buffer가 test 성능과 해석력을 같이 만족하는가?
Q4. 역이 없는 행정동에서 score가 과도하게 0이나 1로 치우치지 않는가?
```

검증 metric:

```text
regression: rmse, mae, spearman_corr
ranking: top_decile_lift
classification view: up/down auc
```

`spearman_corr`를 반드시 본다. UI에서는 정확한 매출액보다 상권 간 순위가 더 중요하다.

## 산출 모델

샘플 학습 artifact:

```text
.artifacts/subway_commercial_trend_score/model.joblib
.artifacts/subway_commercial_trend_score/metadata.json
experiments/01-subway-commercial-trend-score/train-result.json
```

예측 입력:

```json
{
  "area_type": "hdong",
  "area_code": "11200690",
  "quarter_code": 202502,
  "area_alighting_total": 1820300,
  "area_lunch_alighting": 328100,
  "area_evening_alighting": 492000,
  "area_weekend_alighting": 390200,
  "area_alighting_mom_growth": 0.083,
  "area_alighting_3m_growth": 0.142,
  "area_weighted_station_count": 2.7,
  "area_top_station_weight": 0.61
}
```

예측 출력:

```json
{
  "model_id": "subway_commercial_trend_score",
  "area_code": "11200690",
  "score": 0.72,
  "grade": "strong_positive",
  "drivers": {
    "evening_alighting_growth": 0.24,
    "weekend_alighting_growth": 0.31,
    "top_station": "성수"
  }
}
```

## 해석

`score = 0.72`는 이 상권의 지하철 유입 신호가 과거 유사 케이스 대비 강하다는 뜻이다. 매출이 72% 오른다는 뜻이 아니다.

점수 구간:

```text
0.00-0.35 weak
0.35-0.55 neutral
0.55-0.75 positive
0.75-1.00 strong_positive
```

역이 멀거나 영향권 밖인 행정동은 `coverage`를 같이 표시한다.

```json
{
  "score": 0.48,
  "coverage": "low",
  "reason": "weighted_station_count < 0.5"
}
```

## UI

지도에서는 상권/행정동 polygon 색으로 표시한다.

```text
회색: coverage low
파랑: weak
노랑: neutral
초록: positive
진초록: strong_positive
```

상권 카드에는 다음 문구를 쓴다.

```text
지하철 유입 신호 강함
최근 하차 흐름이 과거 유사 상권보다 높습니다.
저녁/주말 하차 증가가 점수에 크게 기여했습니다.
```

차트:

```text
최근 8주 하차 추이
점심/저녁/주말 하차 비중
연결된 주요 역 top 3
```
