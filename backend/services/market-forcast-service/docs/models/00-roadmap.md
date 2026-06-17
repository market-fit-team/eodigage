# market-forcast-service model roadmap

`market-forcast-service`는 여러 XGBoost 모델을 순차적으로 만든다. 각 모델은 가설, 학습 코드, 검증 결과, 모델 해석, UI 해석을 같은 번호로 남긴다.

```text
docs/models/01-subway-commercial-trend-score.md
experiments/01-subway-commercial-trend-score/
├── feature-schema.json
├── train-result.json
├── validation-report.md
└── model-card.md
```

## 모델 순서

```text
01 subway_commercial_trend_score
02 sales_momentum_forecast
03 category_opportunity_score
04 demand_gap_detector
```

`01 subway_commercial_trend_score`는 지하철 하차 흐름을 상권 단기 신호로 바꾼다. 다른 모델이 가져다 쓰는 첫 번째 외생 변수다.

`02 sales_momentum_forecast`는 최근 매출 흐름과 1차 모델 점수로 다음 분기 상승, 보합, 하락을 예측한다.

`03 category_opportunity_score`는 한 상권 안에서 어떤 업종이 유리한지 랭킹한다.

`04 demand_gap_detector`는 유입 신호는 강한데 매출 반응이 아직 약한 상권-업종 조합을 찾는다.

## 공통 산출물

각 모델은 같은 산출물 이름을 사용한다.

```text
feature-schema.json    학습 입력 feature, target, join key
train-result.json      학습 실행 결과, metric, artifact path
validation-report.md   검증 결과와 실패 케이스
model-card.md          모델 의미, 사용 조건, UI 해석
```

`train-result.json`의 `status`는 세 값 중 하나다.

```json
{
  "status": "not_run | trained | rejected"
}
```

## XGBoost

기본 학습기는 XGBoost다.

```text
점수/성장률 예측: XGBRegressor
상승/보합/하락: XGBClassifier
랭킹: XGBRanker, 단 3차 모델 첫 버전은 XGBRegressor
```

artifact는 `.artifacts/<model_id>/`에 저장한다.

```text
.artifacts/<model_id>/model.joblib
.artifacts/<model_id>/metadata.json
```

## 데이터 결합

처음 학습 단위는 `행정동 + 업종 + 기준_년분기_코드`다.

```text
estimated_sales_hdong_2025
-> 행정동_코드, 서비스_업종_코드, 기준_년분기_코드

consumption_hdong
resident_population_hdong
working_population_hdong
apartment_hdong
attraction_facilities_hdong
-> 행정동_코드, 기준_년분기_코드

living_population_hdong_domestic
-> 행정동코드, 기준일ID, 시간대구분

subway ridership
-> 역명, 호선명, 사용월 또는 사용일
-> station_area_weight
-> 행정동_코드 또는 상권_코드
```

상권-역 연결은 좌표 기반으로 처리한다. 서울시 상권영역과 행정동영역은 EPSG:5181이고, 역사마스터는 역 좌표를 제공한다.

## 검증 원칙

시간 누수를 막기 위해 random split을 기본값으로 쓰지 않는다.

```text
train: 오래된 월/분기
valid: 그 다음 월/분기
test: 가장 최근 월/분기
```

`subway_commercial_trend_score`는 과거 기간에서 생성한 지하철 feature로 미래 매출 변화율을 설명하는지 검증한다.

`sales_momentum_forecast`부터는 1차 모델의 과거 시점 score만 사용한다. test 기간의 미래 매출 정보로 만든 score는 feature에 넣지 않는다.

## 참고 문서

- 서울시 상권분석서비스(영역-상권): `https://data.seoul.go.kr/dataList/OA-15560/S/1/datasetView.do`
- 서울시 상권분석서비스(영역-행정동): `https://data.seoul.go.kr/dataList/OA-22160/S/1/datasetView.do`
- 서울시 역사마스터 정보: `https://data.seoul.go.kr/dataList/OA-21232/S/1/datasetView.do`
- 서울시 지하철 호선별 역별 시간대별 승하차 인원 정보: `https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do`
- 서울시 지하철호선별 역별 승하차 인원 정보: `https://data.seoul.go.kr/dataList/OA-12914/S/1/datasetView.do`
- XGBoost Python API: `https://xgboost.readthedocs.io/en/latest/python/python_api.html`

