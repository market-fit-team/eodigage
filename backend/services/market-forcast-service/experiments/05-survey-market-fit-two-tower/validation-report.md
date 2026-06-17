# 05 survey_market_fit_two_tower validation

## run

샘플 설문 페르소나와 L0 synthetic label로 TensorFlow Recommenders smoke 학습을 실행했다.

```text
.venv/bin/python -m app.models.survey_market_fit_two_tower.train --data-mode sample --tfrs
```

실행 시각:

```text
2026-06-17T15:43:16.932099+00:00
```

## sample data

샘플 페르소나는 10개다.

```text
.sample/survey_responses.sample.jsonl
```

item 후보는 샘플 추정매출 데이터에서 만든 고유 `행정동_코드 + 서비스_업종_코드` 5개다.

```text
11110515:CS100001 = 청운효자동 / 한식음식점
11110515:CS100003 = 청운효자동 / 일식음식점
11110515:CS100004 = 청운효자동 / 양식음식점
11110515:CS100005 = 청운효자동 / 제과점
11110515:CS100007 = 청운효자동 / 치킨전문점
```

L0 label 생성 결과:

```text
rows = 50
positive_pairs = 24
negative_pairs = 26
positive_rate = 0.48
hard_constraint_violations_in_positive = 0
```

positive label은 `avoid_category_violation`, `budget_over`가 없는 후보 중 사용자별 상위 후보에만 붙였다.

## metrics

TFRS smoke 학습 결과:

```json
{
  "epochs": 15,
  "final_loss": 14.778645,
  "hit_rate_at_3": 1.0,
  "mrr": 0.9,
  "embedding_dim": 32,
  "item_count": 5,
  "positive_training_pairs": 24
}
```

`hit_rate_at_3 = 1.0`은 추천 품질로 읽지 않는다. item 후보가 5개뿐이고 사용자별 positive가 최대 3개라서 쉬운 검증이다.

현재 metric이 의미하는 것은 다음이다.

```text
설문 JSONL 로드
행정동-서비스업종 item catalog 생성
L0 positive/negative pair 생성
TFRS user tower 학습
TFRS item tower 학습
item embedding 저장
metadata/train-result 저장
```

## next validation

실제 검증에 필요한 최소 샘플:

```text
survey responses >= 50
items >= 200 area-category pairs
positive pairs >= 250
negative pairs >= 1000
```

다음 metric을 본다.

```text
hit_rate_at_5
ndcg_at_10
mrr
constraint_violation_rate
category_diversity_at_10
area_diversity_at_10
```

`constraint_violation_rate`가 먼저 통과해야 한다.

```text
budget violated
avoid category recommended
subway dependency high but subway coverage low
risk low but high volatility item recommended
```

## acceptance

첫 smoke training acceptance는 통과했다.

```text
survey JSONL 로드
item feature table 생성
positive/negative pair 생성
user tower 학습
item tower 학습
top-k retrieval metric 산출
item embedding 저장
metadata/train-result 저장
```

실제 추천 성능 acceptance:

```text
L1 selected_hit_rate_at_5 > popularity baseline
L1 ndcg_at_10 > category-only baseline
constraint_violation_rate < 0.05
category_diversity_at_10 >= 3
```
