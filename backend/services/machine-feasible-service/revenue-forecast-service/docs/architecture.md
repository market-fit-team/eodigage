# revenue-forecast-service

## `app/train.py`

`train.py`는 다음 분기 행정동-업종 추정매출 목 데이터를 만들고 `XGBRegressor`를 학습한다.

```text
generate_mock_data() 1120 rows
-> train_test_split()
-> ColumnTransformer(OneHotEncoder + passthrough)
-> XGBRegressor.fit()
-> model-artifacts/revenue_forecast.joblib
-> model-artifacts/metadata.json
```

target과 feature는 고정돼 있다.

```text
target = next_quarter_estimated_sales_million_krw
categorical = district_code, district_name, borough, service_category
numeric = quarter_code, resident_population_total, worker_population_total,
          living_population_total, subway_peak_boarding, subway_peak_alighting,
          food_spend_ratio, apparel_spend_ratio, medical_spend_ratio,
          weekday_sales_ratio, weekend_sales_ratio, lunch_sales_ratio,
          dinner_sales_ratio, store_count, franchise_store_count,
          opening_store_count, closing_store_count, facility_total_count,
          hospital_count, school_count, apartment_household_count,
          apartment_avg_price_million_krw, rent_per_sqm_thousand_krw,
          vacancy_rate, lag_1_estimated_sales_million_krw,
          lag_4_estimated_sales_million_krw
```

`metadata.json`에는 `rmse`, `mae`, `r2`, `test_rows`, `sample_request`, `source_field_map`이 들어간다.

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

## `app/main.py`

FastAPI 앱은 import 시점에 joblib artifact를 로드한다.
artifact가 없으면 학습을 먼저 실행한다.

```text
GET /health
POST /train
GET /evaluation
POST /predict
```

`POST /predict`는 `RevenueForecastRequest`를 DataFrame 한 행으로 바꾼 뒤 `_model.predict()`를 호출한다.

## 주요 파일

- `app/train.py`
- `app/main.py`
- `Dockerfile`
- `requirements.txt`

## 참고 문서

- https://xgboost.readthedocs.io/en/latest/python/sklearn_estimator.html
- https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22166/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22169/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22183/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do
