# 07 market_anomaly_detector

## 문제

매출과 유입 패턴이 비정상적으로 튀는 행정동-업종 후보를 탐지한다.

```text
sales + subway features
-> IsolationForest
-> anomaly_score
```

이 모델은 추천 모델이 아니라 리스크/모니터링 모델이다.

## 가설

상권 데이터에는 급등, 급락, 일시적 이벤트, 데이터 품질 문제가 섞인다. 이런 후보는 예측/추천 모델의 판단을 왜곡할 수 있으므로 별도 anomaly score로 표시해야 한다.

## 학습

```text
model = sklearn.IsolationForest
contamination = sample size based, max 0.2
```

샘플 실행:

```text
.venv/bin/python -m app.models.market_anomaly_detector.train --data-mode sample
```

결과:

```json
{
  "rows": 25,
  "anomaly_count": 2,
  "anomaly_rate": 0.08
}
```

## UI

추천 카드나 상권 상세에서 경고 badge로 표시한다.

```text
데이터 변동성 높음
최근 패턴이 일반적인 후보와 다릅니다.
```

## artifact

```text
.artifacts/market_anomaly_detector/model.joblib
.artifacts/market_anomaly_detector/anomaly_scores.csv
```

