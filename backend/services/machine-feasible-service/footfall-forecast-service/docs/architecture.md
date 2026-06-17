# footfall-forecast-service

## `app/train.py`

`train.py`는 다음 시간대 행정동 유동인구 목 데이터를 만들고 `XGBRegressor`를 학습한다.

```text
generate_mock_data() 1344 rows
-> train_test_split()
-> ColumnTransformer(OneHotEncoder + passthrough)
-> XGBRegressor.fit()
-> model-artifacts/footfall_forecast.joblib
-> model-artifacts/metadata.json
```

target과 feature는 고정돼 있다.

```text
target = next_hour_footfall
categorical = district_code, district_name, borough, service_category, weekday_group
numeric = date_index, hour, month, holiday_count, subway_boarding,
          subway_alighting, living_population_total,
          living_population_male_ratio, living_population_age_20_30_ratio,
          living_population_age_40_60_ratio, resident_population_total,
          worker_population_total, office_worker_ratio, facility_total_count,
          government_office_count, hospital_count, school_count,
          apartment_household_count, apartment_avg_price_million_krw,
          store_count, franchise_store_count, rent_per_sqm_thousand_krw,
          vacancy_rate, lag_1_hour_footfall, lag_24_hour_footfall
```

`metadata.json`에는 `rmse`, `mae`, `r2`, `test_rows`, `sample_request`, `source_field_map`이 들어간다.

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

## `app/main.py`

FastAPI 앱은 import 시점에 joblib artifact를 로드한다.
artifact가 없으면 학습을 먼저 실행한다.

```text
GET /health
POST /train
GET /evaluation
POST /predict
```

`POST /predict`는 `FootfallForecastRequest`를 DataFrame 한 행으로 바꾼 뒤 `_model.predict()`를 호출한다.

## 주요 파일

- `app/train.py`
- `app/main.py`
- `Dockerfile`
- `requirements.txt`

## 참고 문서

- https://xgboost.readthedocs.io/en/latest/python/sklearn_estimator.html
- https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22178/A/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22169/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22183/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22163/S/1/datasetView.do
