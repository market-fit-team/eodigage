# market-forcast-service

`market-forcast-service`는 여러 상권 예측 모델을 하나의 FastAPI 서비스에서 학습하고 배포한다.

```text
app/api/       HTTP endpoint
app/core/      settings, path constants
app/ml/        model registry, artifact metadata
app/models/    model-specific train/feature/predict modules
.sample/       tracked sample CSV
.raw/          ignored source CSV
.artifacts/    ignored trained model artifacts
```

처음 들어갈 모델은 두 개다.

```text
market_trend_classifier
subway_trend_signal
```

`market_trend_classifier`는 행정동-업종 단위 상승/보합/하락을 예측한다. `subway_trend_signal`은 역별 승하차 변화에서 단기 유입 신호를 만든다.

