# demand_gap_detector model card

## model

`demand_gap_detector`는 수요 신호는 강하지만 매출 반응이 약한 행정동-업종 조합을 찾는다.

```text
model = XGBClassifier
objective = binary:logistic
classes = normal, high_gap
```

## sample artifact

현재 artifact는 샘플 smoke-training artifact다.

```text
.artifacts/demand_gap_detector/model.joblib
.artifacts/demand_gap_detector/metadata.json
```

학습 결과:

```json
{
  "data_mode": "sample",
  "rows": 25,
  "train_rows": 17,
  "valid_rows": 8,
  "accuracy": 0.75,
  "macro_f1": 0.428571,
  "positive_rate": 0.2
}
```

class imbalance가 있어 accuracy보다 macro F1을 우선해서 본다.

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
commute_alighting
night_alighting
lunch_alighting_ratio
evening_alighting_ratio
night_alighting_ratio
```

`target_score`는 지하철 유입 점수다. `sales_amount`와 `target_growth` 계열은 매출 반응 proxy로 사용한다.

## output

운영 출력 shape:

```json
{
  "model_id": "demand_gap_detector",
  "area_code": "11110515",
  "service_category_code": "CS100001",
  "label": "high_gap",
  "gap_score": 0.77,
  "signals": {
    "subway_score": 0.81,
    "sales_response": 0.24
  }
}
```

## not valid for

현재 sample artifact는 아래 용도에 쓰지 않는다.

```text
실제 기회 탐지
창업/투자 의사결정
운영 UI 표시
```

쓸 수 있는 용도:

```text
gap label 생성 파이프라인 검증
binary classifier artifact 저장 검증
후속 UI 응답 shape 검증
```

## UI interpretation

raw 모델 검증 후 UI에서는 “잠재 수요 갭” 경고/기회 배지로 표시한다.

```text
잠재 수요 갭 높음
유입 신호는 강하지만 이 업종 매출 반응은 아직 약합니다.
```

이 점수는 “좋은 창업 후보”가 아니라 “추가 검토 후보”다. 임대료, 경쟁 점포 수, 폐업률 데이터가 없으면 과대평가될 수 있다.

