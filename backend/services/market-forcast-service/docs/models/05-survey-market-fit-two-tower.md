# 05 survey_market_fit_two_tower

## 문제

사용자가 설문지를 입력하면 설문 응답을 user embedding으로 만들고, 행정동-서비스업종 후보를 item embedding으로 만들어 top-k 추천 후보를 검색한다.

추천 item은 상권 단독이 아니다.

```text
item = 행정동_코드 + 서비스_업종_코드
```

예시:

```text
11110515:CS100001 = 청운효자동 / 한식음식점
11110515:CS100005 = 청운효자동 / 제과점
```

업종은 별도 업종 마스터가 아니라 `estimated_sales_hdong_2025`의 `서비스_업종_코드`, `서비스_업종_코드_명`에서 추출한다. 설문 선택지도 이 distinct 목록을 사용한다.

## 가설

개인화 상권 추천은 “좋은 상권”을 찾는 문제가 아니라 “이 사용자의 조건과 맞는 행정동-업종 후보”를 찾는 문제다.

```text
저예산 + 낮은 위험 선호 + 주거 수요 선호
-> 급성장 상권보다 안정적 생활밀착 후보

야간 운영 가능 + 젊은 고객 선호 + 지하철 의존도 높음
-> 저녁/주말 하차가 강한 후보

초보 창업 + 안정성 선호
-> demand_gap만 높은 후보보다 sales_momentum과 category_opportunity가 같이 높은 후보
```

1~4차 모델은 item tower의 numeric feature로 들어간다.

```text
01 subway_commercial_trend_score
02 sales_momentum_forecast
03 category_opportunity_score
04 demand_gap_detector
-> item tower feature
```

## TFRS

5차 모델은 TensorFlow Recommenders retrieval 모델로 구현한다.

```text
user tower: survey response -> user_embedding
item tower: area-category candidate -> item_embedding
score = dot(user_embedding, item_embedding)
loss = retrieval loss
```

TensorFlow Recommenders는 retrieval 모델을 만들고 사용자, 아이템, context feature를 함께 넣을 수 있다. 이 모델은 후보 검색용이다. 최종 정렬은 XGBoost reranker를 붙인다.

```text
TFRS retrieval
-> top 100 candidates
-> XGBoost reranker
-> top 10 recommendations
```

## user tower

user tower는 설문 응답을 vector로 만든다. smoke model은 32차원, production target은 64차원이다.

```text
categorical embedding
+ multi-hot intent vector
+ numeric normalized vector
-> MLP
-> user_embedding
```

입력 feature:

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

## item tower

item tower는 행정동-서비스업종 후보를 vector로 만든다. smoke model은 32차원, production target은 64차원이다.

```text
area_code embedding
+ service_category_code embedding
+ market signal numeric vector
-> MLP
-> item_embedding
```

입력 feature:

```text
area_code
area_name
service_category_code
service_category_name
sales_amount
sales_count
sales_per_count
weekend_sales_ratio
evening_sales_ratio
subway_commercial_trend_score
sales_momentum_up_probability
sales_momentum_down_probability
category_opportunity_score
demand_gap_score
resident_population
worker_population
living_population
consumption_total
food_consumption_ratio
apartment_average_price
attraction_facility_count
weighted_station_count
subway_coverage_level
```

`subway_coverage_level`은 1차 모델의 공간 결합 신뢰도를 나타낸다.

```text
none | low | medium | high
```

## 설문지

설문은 추천 feature 수집이다. 문항은 적지만 tower가 구분해야 하는 축을 빠뜨리지 않는다.

### Q1 budget_band

```json
{
  "id": "budget_band",
  "type": "single_choice",
  "question": "초기 투자 가능 금액은 어느 정도인가요?",
  "options": [
    {"value": "under_50m", "label": "5천만원 미만"},
    {"value": "50m_100m", "label": "5천만원~1억원"},
    {"value": "100m_200m", "label": "1억~2억원"},
    {"value": "over_200m", "label": "2억원 이상"}
  ]
}
```

### Q2 risk_tolerance

```json
{
  "id": "risk_tolerance",
  "type": "single_choice",
  "question": "상권 선택에서 더 가까운 쪽은 무엇인가요?",
  "options": [
    {"value": "low", "label": "안정적인 기존 수요"},
    {"value": "medium", "label": "안정성과 성장성 균형"},
    {"value": "high", "label": "성장 가능성이 큰 신흥 상권"}
  ]
}
```

### Q3 preferred_categories

```json
{
  "id": "preferred_categories",
  "type": "multi_choice",
  "question": "관심 있는 업종을 선택해주세요.",
  "max_select": 5,
  "options_source": "distinct service_category_code/service_category_name from estimated_sales_hdong"
}
```

### Q4 avoid_categories

```json
{
  "id": "avoid_categories",
  "type": "multi_choice",
  "question": "추천에서 제외하고 싶은 업종이 있나요?",
  "max_select": 5,
  "options_source": "distinct service_category_code/service_category_name from estimated_sales_hdong"
}
```

### Q5 operation_time_preference

```json
{
  "id": "operation_time_preference",
  "type": "single_choice",
  "question": "운영 가능한 시간대에 가까운 것은 무엇인가요?",
  "options": [
    {"value": "morning_lunch", "label": "오전~점심 중심"},
    {"value": "afternoon_evening", "label": "오후~저녁 중심"},
    {"value": "night", "label": "야간 운영 가능"},
    {"value": "all_day", "label": "전일 운영 가능"}
  ]
}
```

### Q6 target_customer_age

```json
{
  "id": "target_customer_age",
  "type": "multi_choice",
  "question": "주요 고객으로 생각하는 연령대는 무엇인가요?",
  "options": [
    {"value": "teens_20s", "label": "10~20대"},
    {"value": "30s", "label": "30대"},
    {"value": "40s_50s", "label": "40~50대"},
    {"value": "60plus", "label": "60대 이상"}
  ]
}
```

### Q7 target_customer_context

```json
{
  "id": "target_customer_context",
  "type": "multi_choice",
  "question": "어떤 고객 상황을 더 중요하게 보나요?",
  "options": [
    {"value": "office_worker", "label": "직장인"},
    {"value": "resident", "label": "거주민"},
    {"value": "visitor", "label": "방문객"},
    {"value": "student", "label": "학생"},
    {"value": "family", "label": "가족 단위"}
  ]
}
```

### Q8 location_preference

```json
{
  "id": "location_preference",
  "type": "single_choice",
  "question": "선호하는 입지 유형은 무엇인가요?",
  "options": [
    {"value": "subway_heavy", "label": "역세권 유동인구"},
    {"value": "residential", "label": "주거 밀집"},
    {"value": "office", "label": "업무지구"},
    {"value": "mixed", "label": "복합 상권"}
  ]
}
```

### Q9 subway_dependency

```json
{
  "id": "subway_dependency",
  "type": "scale",
  "question": "지하철 유입이 얼마나 중요하다고 보나요?",
  "min": 1,
  "max": 5
}
```

### Q10 rent_sensitivity

```json
{
  "id": "rent_sensitivity",
  "type": "scale",
  "question": "임대료 부담을 얼마나 크게 보나요?",
  "min": 1,
  "max": 5
}
```

### Q11 competition_tolerance

```json
{
  "id": "competition_tolerance",
  "type": "scale",
  "question": "같은 업종 경쟁이 있어도 괜찮은 편인가요?",
  "min": 1,
  "max": 5
}
```

### Q12 growth_vs_stability

```json
{
  "id": "growth_vs_stability",
  "type": "single_choice",
  "question": "추천 기준으로 더 중요한 쪽은 무엇인가요?",
  "options": [
    {"value": "stability", "label": "안정성"},
    {"value": "balanced", "label": "균형"},
    {"value": "growth", "label": "성장성"}
  ]
}
```

### Q13 owner_experience_level

```json
{
  "id": "owner_experience_level",
  "type": "single_choice",
  "question": "창업 또는 매장 운영 경험이 있나요?",
  "options": [
    {"value": "none", "label": "없음"},
    {"value": "some", "label": "일부 경험"},
    {"value": "experienced", "label": "운영 경험 있음"}
  ]
}
```

### Q14 available_operation_days

```json
{
  "id": "available_operation_days",
  "type": "multi_choice",
  "question": "운영 가능한 요일을 선택해주세요.",
  "options": [
    {"value": "weekday", "label": "평일"},
    {"value": "weekend", "label": "주말"},
    {"value": "holiday", "label": "공휴일"}
  ]
}
```

## 설문 응답 shape

```json
{
  "survey_response_id": "sr_20260617_000001",
  "user_id": "anonymous_or_member_id",
  "answered_at": "2026-06-17T00:00:00Z",
  "budget_band": "50m_100m",
  "risk_tolerance": "medium",
  "preferred_categories": ["CS100001", "CS100005"],
  "avoid_categories": ["CS100007"],
  "operation_time_preference": "afternoon_evening",
  "target_customer_age": ["teens_20s", "30s"],
  "target_customer_context": ["visitor", "office_worker"],
  "location_preference": "subway_heavy",
  "subway_dependency": 5,
  "rent_sensitivity": 3,
  "competition_tolerance": 2,
  "growth_vs_stability": "growth",
  "owner_experience_level": "none",
  "available_operation_days": ["weekday", "weekend"]
}
```

## label

초기에는 실제 클릭/선택 데이터가 없다. 그래서 3단계로 간다.

### L0 synthetic label

설문 응답과 item feature를 규칙으로 매칭해 positive/negative pair를 만든다.

```text
positive if:
  preferred_categories contains item.service_category_code
  budget_band fits item cost proxy
  risk_tolerance matches growth/volatility profile
  location_preference matches area profile
  subway_dependency matches subway score and coverage
  rent_sensitivity is not violated
```

L0는 학습 파이프라인 검증용이다.

### L1 explicit shortlist label

추천 결과를 보여주기 전에 사용자가 관심 후보를 3~5개 고르게 한다.

```text
shown candidates
selected candidates
skipped candidates
```

selected는 positive, shown but skipped는 weak negative다.

### L2 behavior label

서비스 로그가 생기면 label을 바꾼다.

```text
positive:
  상세 페이지 열람
  저장
  비교함 추가
  리포트 다운로드

negative:
  노출 후 무시
  제외 요청
  낮은 평점
```

## 검증

샘플 페르소나로 L0 synthetic 학습을 실행했다.

```json
{
  "survey_responses": 10,
  "items": 5,
  "pairs": 50,
  "positive_pairs": 24,
  "negative_pairs": 26,
  "positive_rate": 0.48,
  "hard_constraint_violations_in_positive": 0,
  "final_loss": 14.778645,
  "hit_rate_at_3": 1.0,
  "mrr": 0.9
}
```

`hit_rate_at_3`와 `mrr`은 item이 5개뿐이라 추천 품질로 읽지 않는다. 지금은 TFRS 학습 파이프라인과 embedding 저장이 동작한다는 검증이다.

확장된 L0 synthetic 검증:

```text
hit_rate_at_5
ndcg_at_10
mrr
constraint_violation_rate
category_diversity_at_10
area_diversity_at_10
```

L1/L2 실제 검증:

```text
selected_hit_rate_at_5
save_rate
detail_click_rate
survey_to_save_conversion
```

실패 케이스:

```text
예산 초과 item 추천
avoid_categories 포함 item 추천
지하철 의존도 높음인데 subway coverage low 추천
안정성 선호인데 demand_gap만 높은 후보 추천
모든 사용자에게 같은 인기 업종 추천
```

## 산출 모델

초기 산출물:

```text
.artifacts/survey_market_fit_two_tower/user_tower.weights.h5
.artifacts/survey_market_fit_two_tower/item_tower.weights.h5
.artifacts/survey_market_fit_two_tower/item_embeddings.csv
.artifacts/survey_market_fit_two_tower/metadata.json
```

실험 산출물:

```text
experiments/05-survey-market-fit-two-tower/feature-schema.json
experiments/05-survey-market-fit-two-tower/train-result.json
experiments/05-survey-market-fit-two-tower/validation-report.md
experiments/05-survey-market-fit-two-tower/model-card.md
```

## UI

설문 화면은 14문항을 한 번에 보여주지 않는다.

```text
Step 1. 예산/위험 성향
Step 2. 업종 선호/제외 업종
Step 3. 운영 방식/목표 고객
Step 4. 입지 선호/유동인구 의존도
Step 5. 결과 확인
```

추천 결과 카드:

```text
청운효자동 · 한식음식점
추천 적합도 82
다음 분기 상승 가능 68
지하철 유입 신호 72
유망 업종 점수 81
잠재 수요 갭 44
```

설명:

```text
선택한 업종과 일치합니다.
저녁 시간대 유입이 강한 상권입니다.
예산 범위 안에서 검토 가능한 후보입니다.
초보 창업자에게는 경쟁 강도가 높은 편입니다.
```

## 해석

two-tower 점수는 사용자 취향과 item 특성의 embedding 유사도다. 매출 예측값이 아니다.

최종 UI에서는 two-tower 점수만 단독으로 보여주지 않는다. 1~4차 모델 점수와 함께 분해해서 보여준다.

```text
개인 적합도: 82
상권 성장성: 68
업종 기회: 81
수요 갭: 44
```

## 참고 문서

- TensorFlow Recommenders: `https://www.tensorflow.org/recommenders`
- TensorFlow Recommenders Basic Retrieval: `https://www.tensorflow.org/recommenders/examples/basic_retrieval`
- TensorFlow Recommenders GitHub: `https://github.com/tensorflow/recommenders`
