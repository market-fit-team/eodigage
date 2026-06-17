# source-data-map

## 서울시 상권분석서비스

행정동 단위 모델 feature는 행정안전부 행정동 코드 기준으로 맞춘다.
서비스별 `metadata.json`의 `source_field_map`은 아래 이름을 기준으로 작성한다.

```text
행정동_코드
행정동_코드_명
서비스_업종_코드_명
기준_년분기_코드
```

## `추정매출-행정동`

`revenue-forecast-service`와 `two-tower-recommender-service`가 쓴다.

```text
당월_매출_금액
주중_매출_금액
주말_매출_금액
시간대_00~06_매출_금액
시간대_06~11_매출_금액
시간대_11~14_매출_금액
시간대_14~17_매출_금액
시간대_17~21_매출_금액
시간대_21~24_매출_금액
```

현재 코드는 원 단위 원천값을 `million_krw` 단위 목 feature로 축약한다.

```text
당월_매출_금액
-> lag_1_estimated_sales_million_krw
-> lag_4_estimated_sales_million_krw
-> next_quarter_estimated_sales_million_krw
```

## `소비-행정동`

`revenue-forecast-service`가 쓴다.

```text
식료품_지출_총금액
의류_신발_지출_총금액
의료비_지출_총금액
```

현재 코드는 금액 자체가 아니라 비중으로 축약한다.

```text
food_spend_ratio
apparel_spend_ratio
medical_spend_ratio
```

## `상주인구-행정동`, `직장인구-행정동`, `생활인구`

`revenue-forecast-service`, `footfall-forecast-service`, `two-tower-recommender-service`가 쓴다.

```text
총_상주인구_수
연령대_20_상주인구_수
연령대_30_상주인구_수
총_직장_인구_수
시간대별 생활인구
성별 생활인구
연령대별 생활인구
```

현재 코드는 총량과 연령 비율로 축약한다.

```text
resident_population_total
worker_population_total
living_population_total
resident_age_20_30_ratio
living_population_age_20_30_ratio
```

## `점포-행정동`, `상권변화지표-행정동`

4개 서비스가 모두 쓴다.

```text
전체_점포_수
일반_점포_수
프랜차이즈_점포_수
개업_점포_수
폐업_점포_수
운영_영업_개월_평균
폐업_영업_개월_평균
상권_변화_지표
```

현재 코드는 개폐업 비율과 생존성 feature로 축약한다.

```text
store_count
franchise_store_count
opening_store_count
closing_store_count
closure_rate
average_operating_months
change_indicator_score
```

## `집객시설-행정동`, `아파트-행정동`

`revenue-forecast-service`, `footfall-forecast-service`, `two-tower-recommender-service`가 쓴다.

```text
집객시설_수
관공서_수
병원_수
학교_수
아파트_단지_수
아파트_세대_수
아파트_평균_면적
아파트_평균_시가
```

현재 코드는 시설 총량과 일부 시설 종류, 아파트 세대 수/가격으로 축약한다.

```text
facility_total_count
government_office_count
hospital_count
school_count
apartment_household_count
apartment_avg_price_million_krw
```

## 지하철 시간대별 승하차

`footfall-forecast-service`, `revenue-forecast-service`, `two-tower-recommender-service`, `breakeven-forecast-service`가 보조 feature로 쓴다.

```text
사용월
호선명
지하철역
04시-05시 승차인원
04시-05시 하차인원
...
23시-24시 승차인원
23시-24시 하차인원
```

현재 코드는 행정동에 가까운 대표 역의 피크 시간대 합계로 축약한다.

```text
subway_boarding
subway_alighting
subway_peak_boarding
subway_peak_ride_count
```

## 프랜차이즈 API

`two-tower-recommender-service`와 `breakeven-forecast-service`가 쓴다.

```text
브랜드명
상호명
평균매출금액
면적단위평균매출금액
가맹사업자보증금액
가맹사업자교육금액
가맹사업자기타금액
가맹사업자가맹금액
```

현재 코드는 브랜드 후보와 창업비용 feature로 축약한다.

```text
brand_name
company_name
avg_brand_sales_million_krw
avg_sales_per_area_million_krw
startup_cost_million_krw
franchise_deposit_million_krw
franchise_education_million_krw
franchise_other_cost_million_krw
```

## 설문 tower

설문 기반 투타워 3개 서비스가 같은 설문 응답 계열을 쓴다.

```text
survey-franchise-fit-service
-> 사용자 설문 tower
-> 프랜차이즈 item tower

survey-district-fit-service
-> 사용자 설문 tower
-> 행정동 item tower

survey-category-fit-service
-> 사용자 설문 tower
-> 업종 item tower
```

설문 응답 feature는 프론트엔드 온보딩 폼으로 바로 받을 수 있는 값만 둔다.

```text
preferred_category
preferred_district_code
risk_tolerance
budget_million_krw
preferred_time_band
primary_goal
owner_operation_hours
food_interest
service_interest
retail_interest
growth_preference
```

item tower는 서울시 상권분석서비스와 프랜차이즈 API feature를 붙인다.

```text
avg_sales_million_krw
avg_sales_per_area_million_krw
franchise_store_count
closure_rate
footfall_index
facility_total_count
rent_per_sqm_thousand_krw
vacancy_rate
capital_intensity
operation_complexity
```

## 리랭킹

`franchise-reranker-service`는 투타워 후보 생성 점수를 다시 입력으로 받는다.

```text
two_tower_score
budget_gap_million_krw
avg_sales_million_krw
avg_sales_per_area_million_krw
startup_cost_million_krw
rent_million_krw
closure_rate
franchise_store_count
footfall_index
brand_power
survey_brand_preference
survey_footfall_preference
```

## 행정동 embedding

`district-embedding-service`는 행정동 상권 feature를 8차원 벡터로 줄인다.

```text
avg_sales_million_krw
food_spend_ratio
resident_population_total
worker_population_total
living_population_total
subway_peak_boarding
subway_peak_alighting
facility_total_count
apartment_household_count
store_count
franchise_store_count
rent_per_sqm_thousand_krw
vacancy_rate
```

## 주요 파일

- `backend/services/two-tower-recommender-service/app/train.py`
- `backend/services/revenue-forecast-service/app/train.py`
- `backend/services/footfall-forecast-service/app/train.py`
- `backend/services/breakeven-forecast-service/app/train.py`
- `backend/services/survey-franchise-fit-service/app/train.py`
- `backend/services/survey-district-fit-service/app/train.py`
- `backend/services/survey-category-fit-service/app/train.py`
- `backend/services/franchise-reranker-service/app/train.py`
- `backend/services/district-embedding-service/app/train.py`
- `docs/ml/model-services.md`

## 참고 문서

- https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22166/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22172/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22169/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22183/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-22163/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-21527/S/1/datasetView.do
- https://www.data.go.kr/data/15110241/openapi.do
- https://www.data.go.kr/data/15110265/openapi.do
- https://www.data.go.kr/data/15110293/openapi.do
- https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html
- https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html
