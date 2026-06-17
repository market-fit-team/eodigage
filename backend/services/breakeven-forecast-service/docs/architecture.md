# breakeven-forecast-service

## `app/train.py`

`train.py`는 초기 투자금 회수 예상 개월 수 목 데이터를 만들고 `XGBRegressor`를 학습한다.

```text
generate_mock_data() 1120 rows
-> train_test_split()
-> ColumnTransformer(OneHotEncoder + passthrough)
-> XGBRegressor.fit()
-> model-artifacts/breakeven_forecast.joblib
-> model-artifacts/metadata.json
```

target과 feature는 고정돼 있다.

```text
target = breakeven_months
categorical = district_code, district_name, borough, service_category,
              district_grade, store_size, commercial_change_grade
numeric = initial_cost_million_krw, franchise_deposit_million_krw,
          franchise_education_million_krw, franchise_other_cost_million_krw,
          monthly_rent_million_krw, rent_per_sqm_thousand_krw,
          vacancy_rate, monthly_labor_cost_million_krw,
          expected_monthly_sales_million_krw, avg_brand_sales_million_krw,
          avg_sales_per_area_million_krw, gross_margin_rate, delivery_ratio,
          store_count, franchise_store_count, opening_store_count,
          closing_store_count, average_operating_months, survival_rate_3y,
          closure_rate, change_indicator_score, facility_total_count,
          subway_peak_boarding, working_capital_million_krw
```

`metadata.json`에는 `rmse`, `mae`, `r2`, `test_rows`, `sample_request`, `source_field_map`이 들어간다.

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

## `app/main.py`

FastAPI 앱은 import 시점에 joblib artifact를 로드한다.
artifact가 없으면 학습을 먼저 실행한다.

```text
GET /health
POST /train
GET /evaluation
POST /predict
```

`POST /predict`는 `BreakevenForecastRequest`를 DataFrame 한 행으로 바꾼 뒤 `_model.predict()`를 호출한다.

## 주요 파일

- `app/train.py`
- `app/main.py`
- `Dockerfile`
- `requirements.txt`

## 참고 문서

- https://xgboost.readthedocs.io/en/latest/python/sklearn_estimator.html
- https://data.seoul.go.kr/dataList/OA-21527/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/DT201015013/S/2/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-15567/S/1/datasetView.do
- https://www.data.go.kr/data/15110241/openapi.do
- https://www.data.go.kr/data/15110265/openapi.do
- https://www.data.go.kr/data/15110293/openapi.do
