# survey-franchise-fit-service

## `app/train.py`

`train.py`는 사용자 설문 tower와 프랜차이즈 item tower를 학습한다.

```text
surveys 160
franchises 180
interactions 1280
-> SurveyFranchiseModel.fit()
-> model-artifacts/survey_franchise.weights.h5
```

`source_field_map`은 설문 응답과 서울시 상권/프랜차이즈 데이터를 연결한다.

```json
{
  "preferred_category": "사용자 설문 희망 업종",
  "avg_sales_million_krw": "상권분석서비스(추정매출-행정동) 업종별 추정매출",
  "brand_power": "공정거래위원회 브랜드별 가맹점 현황 평균매출 기반 브랜드 지표"
}
```

## `app/main.py`

```text
GET /health
POST /train
GET /evaluation
GET /catalog
POST /predict
```

## 주요 파일

- `app/train.py`
- `app/main.py`

## 참고 문서

- https://www.tensorflow.org/recommenders/examples/basic_retrieval
- https://data.seoul.go.kr/dataList/OA-22175/S/1/datasetView.do
- https://www.data.go.kr/data/15110241/openapi.do
