# 03 category_opportunity_score validation

## run

샘플 데이터로 학습과 검증을 실행했다.

```text
.venv/bin/python -m app.models.category_opportunity_score.train --data-mode sample
```

실행 시각:

```text
2026-06-17T15:24:01.677253+00:00
```

## sample validation

3차 모델은 상권 안에서 업종별 기회 점수를 비교하기 위한 회귀 모델이다. 샘플에는 실제 업종별 미래 순위가 없으므로 pseudo opportunity score를 target으로 쓴다.

```text
training rows = 25
train rows = 17
valid rows = 8
```

샘플 target:

```text
opportunity_score =
  0.36 * subway_commercial_trend_score
  + 0.22 * weekend_sales_ratio
  + 0.22 * evening_alighting_ratio
  + 0.20 * lunch_alighting_ratio
```

## metrics

샘플 검증 결과:

```json
{
  "rmse": 0.091685,
  "mae": 0.07231,
  "r2": 0.909738,
  "train_rows": 17,
  "valid_rows": 8
}
```

이 수치는 업종 추천 성능이 아니다. XGBRegressor가 opportunity score 형태의 target을 학습하고 artifact를 저장할 수 있는지 확인한 결과다.

## raw mode

raw mode는 다음 분기 성장률을 이용해 상권 내 상대 우위와 도시 전체 업종 대비 우위를 섞은 target을 만든다.

```text
area_avg = mean(target_growth by quarter_code, area_code)
city_category_avg = mean(target_growth by quarter_code, service_category_code)
opportunity_score = minmax((target_growth - area_avg) + 0.5 * (target_growth - city_category_avg))
```

저장 없이 raw 학습 테이블 생성을 확인했다.

```text
rows = 49727
quarters = 20251, 20252, 20253
target_min = 0.0
target_max = 1.0
target_mean = 0.522455
join_strategy = citywide_quarter_signal
```

예시 row:

```text
quarter_code area_code service_category_code target_growth opportunity_score target_score
20251        11110515  CS100001              0.203192      0.524598          0.528535
20252        11110515  CS100001             -0.190766      0.516208          0.509507
20253        11110515  CS100001              0.213250      0.528086          0.529021
```

## acceptance

샘플 run의 acceptance는 통과했다.

```text
sample feature frame 생성
pseudo opportunity_score 생성
XGBRegressor 학습
rmse/mae/r2 산출
joblib artifact 저장
metadata/train-result 저장
```

아직 통과하지 못한 것은 실제 추천 성능 검증이다.

```text
raw mode 학습 실행
area별 top-k 업종 추천 precision 확인
NDCG@3 확인
XGBRanker 전환 필요성 판단
```

