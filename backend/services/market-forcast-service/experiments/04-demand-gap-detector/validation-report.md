# 04 demand_gap_detector validation

## run

샘플 데이터로 학습과 검증을 실행했다.

```text
.venv/bin/python -m app.models.demand_gap_detector.train --data-mode sample
```

실행 시각:

```text
2026-06-17T15:25:18.780912+00:00
```

## sample validation

4차 모델은 유입 신호 대비 매출 반응이 약한 row를 `high_gap`으로 분류한다.

```text
training rows = 25
train rows = 17
valid rows = 8
positive_rate = 0.2
```

샘플 target:

```text
demand_signal =
  0.45 * subway_commercial_trend_score
  + 0.25 * evening_alighting
  + 0.20 * lunch_alighting
  + 0.10 * night_alighting

sales_response = minmax(sales_amount)
gap = demand_signal - sales_response
high_gap = gap >= 80th percentile
```

## metrics

샘플 검증 결과:

```json
{
  "accuracy": 0.75,
  "macro_f1": 0.428571,
  "train_rows": 17,
  "valid_rows": 8,
  "positive_rate": 0.2
}
```

accuracy는 높아 보이지만 positive class가 20%라서 해석력이 약하다. macro F1이 낮은 값이 더 중요한 신호다. 샘플 run은 binary classifier artifact 생성 검증으로만 본다.

## raw mode

raw mode는 수요 신호와 실제 다음 분기 성장률 반응 차이를 gap으로 만든다.

```text
demand_signal = subway/lunch/evening/night demand composite
sales_response = minmax(target_growth)
gap = demand_signal - sales_response
high_gap = top 20% gap
```

저장 없이 raw 학습 테이블 생성을 확인했다.

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

예시 row:

```text
quarter_code area_code service_category_code target_growth gap_score high_gap
20251        11110515  CS100001              0.203192      0.240372  0
20252        11110515  CS100001             -0.190766      0.757417  1
20253        11110515  CS100001              0.213250      0.599521  0
```

## acceptance

샘플 run의 acceptance는 통과했다.

```text
sample feature frame 생성
synthetic gap label 생성
XGBClassifier 학습
accuracy/macro_f1 산출
joblib artifact 저장
metadata/train-result 저장
```

아직 통과하지 못한 것은 실제 gap 탐지 성능 검증이다.

```text
raw mode 학습 실행
precision@20 확인
top decile rebound rate 확인
임대료/경쟁 점포 데이터 추가 후 false positive 감소 확인
```

