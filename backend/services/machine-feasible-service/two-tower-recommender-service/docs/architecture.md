# two-tower-recommender-service

## `app/train.py`

`train.py`는 TensorFlow Recommenders retrieval 모델을 학습한다.
목 데이터는 서울시 상권분석서비스와 공정거래위원회 가맹 API의 필드 의미를 따라 만든다.

```text
generate_mock_catalog()
-> users 128
-> franchises 144
-> generate_interactions() 1024
-> FranchiseTwoTower.fit()
-> model-artifacts/two_tower.weights.h5
-> model-artifacts/metadata.json
```

`FranchiseTwoTower`는 user tower와 franchise tower를 분리한다.

```py
class FranchiseTwoTower(tfrs.Model):
    def compute_loss(self, features: dict[str, tf.Tensor], training: bool = False) -> tf.Tensor:
        user_embeddings = self.user_model({name: features[name] for name in USER_FEATURE_FIELDS})
        franchise_embeddings = self.franchise_model(
            {name: features[name] for name in FRANCHISE_FEATURE_FIELDS}
        )
        return self.task(user_embeddings, franchise_embeddings, compute_metrics=False)
```

user tower는 예비창업자 조건을 받는다.

```text
user_id
preferred_category
preferred_district_code
investment_budget_million_krw
risk_tolerance
target_age_group
preferred_food_spend_ratio
preferred_weekend_ratio
target_resident_population
target_worker_population
```

franchise tower는 브랜드와 행정동 상권 지표를 받는다.

```text
franchise_id
category
district_code
startup_cost_million_krw
avg_sales_million_krw
avg_sales_per_area_million_krw
franchise_store_count
closure_rate
subway_peak_ride_count
living_population_total
resident_population_total
worker_population_total
facility_total_count
apartment_avg_price_million_krw
rent_per_sqm_thousand_krw
vacancy_rate
brand_power
```

`metadata.json`에는 `source_field_map`이 들어간다.

```json
{
  "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 당월 매출 금액",
  "franchise_store_count": "상권분석서비스(점포-행정동) 프랜차이즈 점포 수",
  "avg_sales_per_area_million_krw": "공정거래위원회 브랜드별 가맹점 현황 면적단위 평균매출"
}
```

검증 지표는 validation interaction에 대해 전체 프랜차이즈 catalog를 dot product로 정렬해 계산한다.

```json
{
  "hit_rate_at_5": 0.227,
  "mean_reciprocal_rank": 0.1624,
  "validation_interactions": 185.0
}
```

## `app/main.py`

FastAPI 앱은 import 시점에 artifact를 로드한다.
artifact가 없으면 `train_and_save()`를 호출한다.

```text
GET /health
POST /train
GET /evaluation
GET /catalog
POST /predict
```

`POST /predict`는 `user_id`만 받아도 저장된 사용자 프로필을 사용한다.
요청에 사용자 조건을 넣으면 해당 필드만 덮어쓴다.

```json
{
  "user_id": "user-000",
  "top_k": 5,
  "preferred_category": "coffee",
  "preferred_district_code": "1168064000",
  "investment_budget_million_krw": 180.0
}
```

## 주요 파일

- `app/train.py`
- `app/main.py`
- `Dockerfile`
- `requirements.txt`

## 참고 문서

- https://www.tensorflow.org/recommenders/examples/quickstart
- https://www.tensorflow.org/recommenders/examples/basic_retrieval
- https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do
- https://www.data.go.kr/data/15110241/openapi.do
- https://www.data.go.kr/data/15110265/openapi.do
