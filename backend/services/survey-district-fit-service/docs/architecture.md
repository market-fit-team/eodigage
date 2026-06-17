# survey-district-fit-service

## `app/train.py`

사용자 설문 tower와 행정동 item tower를 학습한다.

```text
surveys 170
district_items 96
interactions 1190
-> SurveyDistrictModel.fit()
```

행정동 item은 추정매출, 유동인구, 상주/직장인구, 집객시설, 점포 수, 임대료, 공실률, 폐업률을 가진다.

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
- https://data.seoul.go.kr/dataList/OA-14991/S/1/datasetView.do
