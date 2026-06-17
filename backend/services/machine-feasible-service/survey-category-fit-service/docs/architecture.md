# survey-category-fit-service

## `app/train.py`

사용자 설문 tower와 업종 item tower를 학습한다.

```text
surveys 150
category_items 126
interactions 1050
-> SurveyCategoryModel.fit()
```

업종 item은 자본 강도, 평균매출, 마진, 폐업률, 프랜차이즈 밀도, 주말/저녁 매출 비중, 운영 복잡도를 가진다.

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
- https://www.data.go.kr/data/15110293/openapi.do
