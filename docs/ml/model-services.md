# model-services

## `docker-compose.yml`

`docker-compose.yml`은 4개 ML 서비스를 Traefik 뒤에 둔다.

```text
/api/ml/two-tower
-> two-tower-recommender-service:8000

/api/ml/revenue-forecast
-> revenue-forecast-service:8000

/api/ml/footfall-forecast
-> footfall-forecast-service:8000

/api/ml/breakeven-forecast
-> breakeven-forecast-service:8000

/api/ml/survey-franchise-fit
-> survey-franchise-fit-service:8000

/api/ml/survey-district-fit
-> survey-district-fit-service:8000

/api/ml/survey-category-fit
-> survey-category-fit-service:8000

/api/ml/franchise-reranker
-> franchise-reranker-service:8000

/api/ml/district-embedding
-> district-embedding-service:8000
```

각 서비스는 FastAPI 기본 OpenAPI JSON을 쓴다.

```yaml
labels:
  - app.api.enabled=true
  - app.api.name=footfall-forecast
  - app.api.publicPath=/api/ml/footfall-forecast
  - app.api.openapiPath=/openapi.json
  - app.api.schemasType=zod
```

```text
GET http://localhost:8088/api/ml/footfall-forecast/openapi.json
-> StripPrefix /api/ml/footfall-forecast
-> GET footfall-forecast-service:8000/openapi.json
```

## source field map

각 학습 스크립트는 `metadata.json`에 `source_field_map`을 저장한다.
API 필드는 영문 snake_case다.
매핑 값은 실제로 붙일 공공데이터의 한국어 컬럼 의미다.

```json
{
  "district_code": "행정동_코드",
  "district_name": "행정동_코드_명",
  "service_category": "서비스_업종_코드_명",
  "franchise_store_count": "점포-행정동 프랜차이즈_점포_수"
}
```

## `two-tower-recommender-service`

`backend/services/two-tower-recommender-service/app/train.py`는 사용자 128건, 브랜드 144건, interaction 1,024건을 만든다.
TFRS retrieval 모델은 user tower와 franchise tower를 분리한다.

```text
generate_mock_catalog()
-> users 128
-> franchises 144
-> generate_interactions() 1024
-> FranchiseTwoTower.fit()
-> model-artifacts/two_tower.weights.h5
-> model-artifacts/metadata.json
```

user tower 입력은 아래 shape다.

```json
{
  "user_id": "user-000",
  "preferred_category": "coffee",
  "preferred_district_code": "1168064000",
  "investment_budget_million_krw": 180.0,
  "risk_tolerance": "medium",
  "target_age_group": "30s",
  "preferred_food_spend_ratio": 0.28,
  "preferred_weekend_ratio": 0.42,
  "target_resident_population": 28000,
  "target_worker_population": 42000
}
```

candidate tower 입력은 브랜드 ID, 업종, 행정동 코드, 창업비용, 평균매출, 면적당 평균매출, 프랜차이즈 점포 수, 폐업률, 지하철 피크 승하차, 생활/상주/직장인구, 집객시설, 아파트 가격, 임대료, 공실률, 브랜드 지표를 쓴다.

`POST /predict`는 저장된 사용자 프로필을 쓰거나 요청값으로 덮어쓴다.

```json
{
  "user_id": "user-000",
  "top_k": 5,
  "preferred_category": "coffee",
  "preferred_district_code": "1168064000",
  "investment_budget_million_krw": 180.0
}
```

검증 결과는 `GET /evaluation`에서 반환된다.

```json
{
  "mock_rows": {
    "users": 128,
    "franchises": 144,
    "interactions": 1024
  },
  "metrics": {
    "hit_rate_at_5": 0.227,
    "mean_reciprocal_rank": 0.1624,
    "validation_interactions": 185.0
  }
}
```

## `revenue-forecast-service`

`backend/services/revenue-forecast-service/app/train.py`는 1,120건 목 데이터를 만든다.
target은 다음 분기 행정동-업종 추정매출이다.

```text
target = next_quarter_estimated_sales_million_krw
rows = 1120
model = XGBRegressor
```

`POST /predict` 요청 shape는 아래와 같다.

```json
{
  "district_code": "1168064000",
  "district_name": "강남구 역삼동",
  "borough": "강남구",
  "service_category": "coffee",
  "quarter_code": 202604,
  "resident_population_total": 31000,
  "worker_population_total": 42000,
  "living_population_total": 88000,
  "subway_peak_boarding": 52000,
  "subway_peak_alighting": 49500,
  "food_spend_ratio": 0.34,
  "store_count": 58,
  "franchise_store_count": 17,
  "opening_store_count": 6,
  "closing_store_count": 4,
  "facility_total_count": 91,
  "apartment_avg_price_million_krw": 1780.0,
  "rent_per_sqm_thousand_krw": 82.0,
  "vacancy_rate": 6.4,
  "lag_1_estimated_sales_million_krw": 118.0,
  "lag_4_estimated_sales_million_krw": 103.0
}
```

검증 결과는 `GET /evaluation`에서 반환된다.

```json
{
  "rows": 1120,
  "metrics": {
    "rmse": 4.9303,
    "mae": 3.9491,
    "r2": 0.9634,
    "test_rows": 247
  }
}
```

## `footfall-forecast-service`

`backend/services/footfall-forecast-service/app/train.py`는 1,344건 목 데이터를 만든다.
target은 다음 시간대 행정동 유동인구다.

```text
target = next_hour_footfall
rows = 1344
model = XGBRegressor
```

`POST /predict` 요청 shape는 아래와 같다.

```json
{
  "district_code": "1120069000",
  "district_name": "성동구 성수동",
  "borough": "성동구",
  "service_category": "dessert",
  "weekday_group": "weekend",
  "date_index": 48,
  "hour": 18,
  "month": 7,
  "subway_boarding": 42800,
  "subway_alighting": 45100,
  "living_population_total": 92000,
  "resident_population_total": 29000,
  "worker_population_total": 23000,
  "facility_total_count": 76,
  "apartment_household_count": 5800,
  "store_count": 52,
  "rent_per_sqm_thousand_krw": 57.0,
  "vacancy_rate": 5.7,
  "lag_1_hour_footfall": 8100.0,
  "lag_24_hour_footfall": 7600.0
}
```

검증 결과는 `GET /evaluation`에서 반환된다.

```json
{
  "rows": 1344,
  "metrics": {
    "rmse": 301.7815,
    "mae": 240.4765,
    "r2": 0.9959,
    "test_rows": 296
  }
}
```

## `breakeven-forecast-service`

`backend/services/breakeven-forecast-service/app/train.py`는 1,120건 목 데이터를 만든다.
target은 초기 투자금 회수 예상 개월 수다.

```text
target = breakeven_months
rows = 1120
model = XGBRegressor
```

상권변화지표의 운영 개월/생존율/개폐업 성향, 점포 수, 프랜차이즈 창업비용, 브랜드 평균매출, 임대료/공실률을 같이 쓴다.

```json
{
  "district_code": "1168064000",
  "district_name": "강남구 역삼동",
  "borough": "강남구",
  "service_category": "coffee",
  "district_grade": "B",
  "store_size": "medium",
  "commercial_change_grade": "stable",
  "initial_cost_million_krw": 145.0,
  "franchise_deposit_million_krw": 18.0,
  "franchise_education_million_krw": 4.0,
  "franchise_other_cost_million_krw": 42.0,
  "monthly_rent_million_krw": 7.8,
  "expected_monthly_sales_million_krw": 62.0,
  "avg_brand_sales_million_krw": 70.0,
  "avg_sales_per_area_million_krw": 5.8,
  "average_operating_months": 58.0,
  "survival_rate_3y": 0.54,
  "closure_rate": 0.07,
  "change_indicator_score": 0.52
}
```

검증 결과는 `GET /evaluation`에서 반환된다.

```json
{
  "rows": 1120,
  "metrics": {
    "rmse": 1.5205,
    "mae": 1.058,
    "r2": 0.9101,
    "test_rows": 247
  }
}
```

## `MODEL_DIR`

서비스별 Dockerfile은 build 중 `python -m app.train`을 실행한다.
로컬에서 artifact 위치를 바꿀 때는 `MODEL_DIR`을 준다.

```text
MODEL_DIR=backend/services/revenue-forecast-service/model-artifacts \
uv run --python 3.11 --with-requirements requirements.txt python -m app.train
```

`model-artifacts/`는 `.gitignore`에 둔다.
컨테이너 이미지는 build 시점에 `/app/model-artifacts`를 가진다.
런타임에 artifact가 없으면 `load_artifacts()` 또는 `load_metadata()`가 다시 학습한다.

## `survey-franchise-fit-service`

사용자 설문 응답 tower와 프랜차이즈 item tower를 직접 맞춘다.

```text
surveys = 160
franchises = 180
interactions = 1280
model = TensorFlow Recommenders retrieval
```

검증 결과는 `GET /evaluation`에서 반환된다.

```json
{
  "metrics": {
    "hit_rate_at_5": 0.1732,
    "mean_reciprocal_rank": 0.1314,
    "validation_interactions": 231.0
  }
}
```

## `survey-district-fit-service`

사용자 설문 응답 tower와 행정동 item tower를 직접 맞춘다.
입지 추천용 후보 생성 모델이다.

```text
surveys = 170
district_items = 96
interactions = 1190
model = TensorFlow Recommenders retrieval
```

```json
{
  "metrics": {
    "hit_rate_at_5": 0.2465,
    "mean_reciprocal_rank": 0.1412,
    "validation_interactions": 215.0
  }
}
```

## `survey-category-fit-service`

사용자 설문 응답 tower와 업종 item tower를 직접 맞춘다.
업종 추천용 후보 생성 모델이다.

```text
surveys = 150
category_items = 126
interactions = 1050
model = TensorFlow Recommenders retrieval
```

```json
{
  "metrics": {
    "hit_rate_at_5": 0.1905,
    "mean_reciprocal_rank": 0.1416,
    "validation_interactions": 189.0
  }
}
```

## `franchise-reranker-service`

투타워가 만든 후보를 `XGBRanker`로 재정렬한다.

```text
queries = 180
candidates per query = 12
rows = 2160
model = XGBRanker(objective="rank:ndcg")
```

```json
{
  "metrics": {
    "ndcg_at_5": 0.9937,
    "test_queries": 35
  }
}
```

`POST /rerank`와 `POST /predict`는 같은 핸들러를 쓴다.

## `district-embedding-service`

행정동 상권 feature를 8차원 PCA embedding으로 만들고 cosine nearest neighbors index를 둔다.

```text
rows = 240
embedding_dimensions = 8
model = StandardScaler + PCA + NearestNeighbors
```

```json
{
  "metrics": {
    "silhouette_by_mock_cluster": 0.1477
  }
}
```

`POST /similar`는 저장된 행정동 item 기준으로 이웃을 찾는다.
`POST /predict`는 요청 feature를 즉시 embedding으로 바꾸고 이웃을 반환한다.

## 주요 파일

- `docker-compose.yml`
- `backend/services/two-tower-recommender-service/app/train.py`
- `backend/services/two-tower-recommender-service/app/main.py`
- `backend/services/revenue-forecast-service/app/train.py`
- `backend/services/revenue-forecast-service/app/main.py`
- `backend/services/footfall-forecast-service/app/train.py`
- `backend/services/footfall-forecast-service/app/main.py`
- `backend/services/breakeven-forecast-service/app/train.py`
- `backend/services/breakeven-forecast-service/app/main.py`
- `backend/services/survey-franchise-fit-service/app/train.py`
- `backend/services/survey-franchise-fit-service/app/main.py`
- `backend/services/survey-district-fit-service/app/train.py`
- `backend/services/survey-district-fit-service/app/main.py`
- `backend/services/survey-category-fit-service/app/train.py`
- `backend/services/survey-category-fit-service/app/main.py`
- `backend/services/franchise-reranker-service/app/train.py`
- `backend/services/franchise-reranker-service/app/main.py`
- `backend/services/district-embedding-service/app/train.py`
- `backend/services/district-embedding-service/app/main.py`

## 참고 문서

- https://www.tensorflow.org/recommenders/examples/quickstart
- https://www.tensorflow.org/recommenders/examples/basic_retrieval
- https://xgboost.readthedocs.io/en/latest/python/sklearn_estimator.html
- https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html
- https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html
- https://fastapi.tiangolo.com/tutorial/metadata/
- https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22166/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22169/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22183/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do
- https://www.data.go.kr/data/15110241/openapi.do
- https://www.data.go.kr/data/15110265/openapi.do
- https://www.data.go.kr/data/15110293/openapi.do
