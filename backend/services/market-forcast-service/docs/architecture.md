# market-forcast-service

`app/main.py`는 여러 예측 모델을 하나의 FastAPI 앱으로 노출한다.

```text
app.main:app
-> app.api.routes.router
-> app.ml.registry.MODEL_SPECS
-> app.models.<model_id>
-> .artifacts/<model_id>/metadata.json
```

## app/api/routes.py

현재 라우터는 모델 레지스트리와 artifact metadata를 읽는다.

```text
GET  /health
GET  /models
GET  /models/{model_id}
POST /models/{model_id}/train
POST /models/{model_id}/predict
```

`POST /models/{model_id}/train`과 `POST /models/{model_id}/predict`는 모델별 `train.py`, `predict.py`가 들어오면 연결한다.

## app/ml/registry.py

`MODEL_SPECS`가 서비스가 알고 있는 모델 목록이다.

```py
ModelSpec(
    model_id="market_trend_classifier",
    task="classification",
    package="app.models.market_trend_classifier",
    artifact_name="model.joblib",
)
```

새 모델을 추가할 때는 `app/models/<model_id>/`를 만들고 `MODEL_SPECS`에 한 줄을 추가한다.

## app/models

모델별 코드는 서로 섞지 않는다.

```text
app/models/
├── market_trend_classifier/
│   ├── contract.py
│   ├── features.py
│   ├── train.py
│   └── predict.py
└── subway_trend_signal/
    ├── contract.py
    ├── features.py
    ├── train.py
    └── predict.py
```

`contract.py`에는 API 입력과 출력 DTO를 둔다. `features.py`는 CSV/API 데이터를 모델 입력 행으로 바꾼다. `train.py`는 `.raw/` 또는 외부 API snapshot에서 학습하고 `.artifacts/<model_id>/`에 결과를 저장한다. `predict.py`는 artifact를 로드해 예측한다.

## data

원본과 산출물은 분리한다.

```text
.raw/              원본 CSV, git 제외
.sample/           샘플 CSV, git 포함
data/processed/    학습용 중간 테이블, git 제외
.artifacts/        모델 파일과 metadata, git 제외
```

## 모델

`market_trend_classifier`는 행정동-업종 단위 트렌드를 예측한다.

```text
estimated_sales_hdong_2025
+ consumption_hdong
+ resident_population_hdong
+ working_population_hdong
+ living_population_hdong_domestic
+ apartment_hdong
+ attraction_facilities_hdong
+ subway_trend_signal
-> up / flat / down
```

`subway_trend_signal`은 역별 최근 승하차 변화량을 단기 유입 신호로 만든다.

```text
current_7d_boarding, current_7d_alighting
previous_7d_boarding, previous_7d_alighting
commute_alighting, lunch_alighting, night_alighting
weekend_ratio
-> trend_score
```

## 참고 문서

- FastAPI Bigger Applications: `https://fastapi.tiangolo.com/tutorial/bigger-applications/`
- FastAPI APIRouter: `https://fastapi.tiangolo.com/reference/apirouter/`
- scikit-learn Model persistence: `https://scikit-learn.org/stable/model_persistence.html`
- Cookiecutter Data Science: `https://cookiecutter-data-science.drivendata.org/`
