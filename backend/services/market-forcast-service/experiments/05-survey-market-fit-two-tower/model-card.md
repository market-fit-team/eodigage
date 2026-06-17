# survey_market_fit_two_tower model card

## model

`survey_market_fit_two_tower`는 설문 응답 user embedding과 행정동-서비스업종 item embedding을 비교해 개인화 추천 후보를 검색한다.

```text
score = dot(user_embedding, item_embedding)
```

구현 후보는 TensorFlow Recommenders다.

## status

```text
sample_trained
```

LLM이 만든 샘플 설문 페르소나 10개와 L0 synthetic label로 TensorFlow Recommenders smoke 학습을 실행했다.

```json
{
  "rows": 50,
  "positive_pairs": 24,
  "negative_pairs": 26,
  "final_loss": 14.778645,
  "hit_rate_at_3": 1.0,
  "mrr": 0.9,
  "embedding_dim": 32,
  "item_count": 5
}
```

item이 5개뿐이라 ranking metric은 과대평가된다.

## user tower

입력:

```text
budget_band
risk_tolerance
preferred_categories
avoid_categories
operation_time_preference
target_customer_age
target_customer_context
location_preference
subway_dependency
rent_sensitivity
competition_tolerance
growth_vs_stability
owner_experience_level
available_operation_days
```

출력:

```text
user_embedding: 32d in smoke model
user_embedding: 64d target for production model
```

## item tower

item:

```text
area_code + service_category_code
```

업종 source:

```text
estimated_sales_hdong_2025.서비스_업종_코드
estimated_sales_hdong_2025.서비스_업종_코드_명
```

입력:

```text
1차 지하철 유입 점수
2차 매출 momentum 예측
3차 업종 기회 점수
4차 수요 gap 점수
매출/인구/소비/아파트/시설 feature
```

출력:

```text
item_embedding: 32d in smoke model
item_embedding: 64d target for production model
```

## artifacts

```text
.artifacts/survey_market_fit_two_tower/user_tower.weights.h5
.artifacts/survey_market_fit_two_tower/item_tower.weights.h5
.artifacts/survey_market_fit_two_tower/item_embeddings.csv
.artifacts/survey_market_fit_two_tower/metadata.json
```

## output

운영 출력 shape:

```json
{
  "model_id": "survey_market_fit_two_tower",
  "survey_response_id": "sr_20260617_000001",
  "items": [
    {
      "area_code": "11110515",
      "area_name": "청운효자동",
      "service_category_code": "CS100001",
      "service_category_name": "한식음식점",
      "personal_fit_score": 0.82,
      "market_growth_score": 0.68,
      "category_opportunity_score": 0.81,
      "demand_gap_score": 0.44
    }
  ]
}
```

## not valid for

현재 상태에서는 아래 용도에 쓰지 않는다.

```text
실제 추천
운영 API 응답
창업 의사결정
```

쓸 수 있는 용도:

```text
설문 설계 검토
user/item feature 계약 확정
추천 UI 설계
TFRS 학습 파이프라인 검증
item embedding 저장 검증
```

## UI interpretation

two-tower 점수는 개인 적합도다. 매출 예측이 아니다.

UI에서는 점수를 분리해서 보여준다.

```text
개인 적합도
상권 성장성
업종 기회
잠재 수요 갭
```

추천 사유는 설문 응답과 item feature의 매칭으로 만든다.

```text
선호 업종과 일치
지하철 유입 의존도와 상권 특성이 일치
예산 범위 안의 후보
저녁 운영 가능성과 저녁 유입 패턴 일치
```
