# subway_commercial_trend_score model card

## model

`subway_commercial_trend_score` converts subway alighting patterns around a commercial area into a 0..1 trend signal.

## sample artifact

첫 artifact는 샘플 smoke-training artifact다. 학습 파이프라인 검증에는 쓸 수 있다. 서비스 추론에는 쓰지 않는다.

```text
.artifacts/subway_commercial_trend_score/model.joblib
.artifacts/subway_commercial_trend_score/metadata.json
```

학습 결과:

```json
{
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "rmse": 0.030651,
  "mae": 0.026152,
  "r2": 0.988915
}
```

이 metric은 pseudo target에 대한 적합도다. 상권 예측 성능으로 읽지 않는다.

## score

production score는 다음 의미로 쓴다.

```text
0.00-0.35 weak subway demand signal
0.35-0.55 neutral signal
0.55-0.75 positive signal
0.75-1.00 strong positive signal
```

sample score는 작은 샘플 테이블 안에서 weighted alighting과 sales-derived pseudo target이 높다는 뜻이다.

## input contract

샘플 학습 feature:

```text
boarding_total
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
station_area_weight
weighted_alighting_total
weighted_lunch_alighting
weighted_evening_alighting
sales_amount
sales_count
sales_per_count
weekend_sales_ratio
evening_sales_ratio
```

raw mode에서 `station_area_weight`는 `data/external/station_area_weights.csv`로 만든다. 파일이 없으면 서울 전체 지하철 분기 신호를 붙이는 baseline으로만 동작한다.

## not valid for

현재 sample artifact는 아래 용도에 쓰지 않는다.

```text
상권 추천
업종 추천
매출 성장률 예측
지도 색상 표시
운영 API 응답
```

아래 용도에는 쓸 수 있다.

```text
학습 코드 smoke test
artifact 저장 경로 검증
metadata 구조 검증
후속 모델 입력 shape 실험
```

## UI interpretation

실제 raw 모델이 검증된 뒤에는 이 모델을 직접 매출 예측이 아니라 외부 유입 신호로 보여준다.

```text
지하철 유입 신호 강함
최근 하차 패턴이 상권 활성화 방향으로 움직입니다.
```

When coverage is low:

```text
지하철 신호 부족
이 상권은 연결된 역 영향권이 약해 지하철 기반 점수 신뢰도가 낮습니다.
```
