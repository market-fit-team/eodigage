# 01 subway_commercial_trend_score validation

## run

샘플 데이터로 학습과 검증을 실행했다.

```text
.venv/bin/python -m app.models.subway_commercial_trend_score.train --data-mode sample
```

실행 시각:

```text
2026-06-17T15:16:40.924121+00:00
```

## sample validation

샘플 실행은 5개 지하철역 row와 5개 매출 row를 cross join해서 25개 학습 row를 만든다.

```text
subway rows = 5
sales rows = 5
training rows = 25
train rows = 17
valid rows = 8
```

샘플 데이터는 지하철 `202605` 한 달과 매출 `20251` 한 분기만 담고 있다. 그래서 샘플 검증은 시간 기준 split이 아니라 random split이다.

실제 raw 학습은 `quarter_code`가 여러 개일 때 가장 최근 분기를 validation으로 사용한다.

```text
train = quarter_code < max(quarter_code)
valid = quarter_code == max(quarter_code)
```

## metrics

샘플 검증 결과:

```json
{
  "rmse": 0.030651,
  "mae": 0.026152,
  "r2": 0.988915,
  "valid_rows": 8,
  "train_rows": 17,
  "total_rows": 25
}
```

이 수치는 모델 품질 지표로 쓰지 않는다. target이 실제 미래 매출이 아니라 샘플 안에서 만든 pseudo score이기 때문이다.

이번 수치가 의미하는 것은 다음 한 가지다.

```text
CSV 로드
-> 지하철 시간대 feature 생성
-> 매출 feature 생성
-> target_score 생성
-> XGBRegressor 학습
-> validation 예측
-> joblib/metadata/train-result 저장
```

위 파이프라인이 끝까지 동작했다.

## raw mode

학습 코드는 실제 `.raw` 데이터도 입력받는다.

```text
.venv/bin/python -m app.models.subway_commercial_trend_score.train --data-mode raw
```

raw mode의 target은 실제 다음 분기 매출 성장률이다.

```text
target_growth = log(next_quarter_sales + 1) - log(current_quarter_sales + 1)
target_score = minmax(target_growth)
```

현재 raw mode의 지하철 결합 전략:

```text
data/external/station_area_weights.csv 있음
-> 역-상권/행정동 공간 가중치로 결합

data/external/station_area_weights.csv 없음
-> 서울 전체 분기 지하철 하차 신호를 모든 행정동-업종 row에 결합
```

두 번째 전략은 실제 상권-역 모델이 아니다. raw ingestion과 temporal target construction을 검증하기 위한 baseline이다.

저장 없이 raw 학습 테이블 생성을 확인했다.

```text
rows = 49727
quarters = 20251, 20252, 20253
join_strategy = citywide_quarter_signal
```

예시 row:

```text
quarter_code area_code service_category_code target_growth target_score alighting_total
20251        11110515  CS100001              0.203192      0.528535     598954895
20252        11110515  CS100001             -0.190766      0.509507     650498334
20253        11110515  CS100001              0.213250      0.529021     637978557
```

raw mode를 실제 학습까지 실행하면 `experiments/01-subway-commercial-trend-score/train-result.json`이 raw 결과로 덮인다. 현재 저장된 `train-result.json`은 sample 학습 결과다.

## station_area_weights.csv

실제 모델 품질 검증에는 아래 파일이 필요하다.

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

권장 컬럼:

```text
station_id
area_type
distance_m
buffer_m
intersect_area
raw_weight
```

이 파일은 서울시 역사마스터 좌표와 서울시 상권/행정동 영역 polygon을 EPSG:5181 기준으로 공간 조인해서 만든다.

## acceptance

샘플 run의 acceptance는 통과했다.

```text
read sample CSV
create subway and sales features
train XGBRegressor
save joblib artifact
write metadata and train-result.json
```

아직 통과하지 못한 것은 실제 예측력 검증이다.

```text
station_area_weights.csv 생성
raw mode 학습 실행
time-based validation metric 확인
상권 coverage 낮은 row의 score 안정성 확인
```
