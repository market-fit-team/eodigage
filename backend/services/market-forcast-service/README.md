# market-forcast-service

`market-forcast-service`는 상권 예측, 업종 기회 탐지, 설문 기반 개인화 추천 모델을 한 서비스 안에서 학습하고 배포한다.

```text
app/models/      모델별 feature/train 코드
docs/models/     모델 연구 문서
experiments/     feature schema, train-result, validation, model-card
.sample/         git 추적 샘플 데이터
.raw/            git 제외 원본 데이터
.artifacts/      git 제외 학습 artifact
```

## 실행 단위

각 모델은 독립 실행한다.

```text
.venv/bin/python -m app.models.<model_id>.train --data-mode sample
.venv/bin/python -m app.models.<model_id>.train --data-mode raw
```

5차 two-tower는 TFRS smoke 학습을 실행한다.

```text
.venv/bin/python -m app.models.survey_market_fit_two_tower.train --data-mode sample --tfrs
```

## 유망 모델 순위

현재 서비스 적용 우선순위다.

| 순위 | 모델 | 상태 | 적용 UI | 판단 |
| ---: | --- | --- | --- | --- |
| 1 | `sales_momentum_forecast` | sample trained | 행정동-업종 상승/보합/하락 badge | 가장 직접적인 상권 트렌드 예측 모델 |
| 2 | `survey_market_fit_two_tower` | sample trained | 설문 기반 개인화 추천 | 사용자 입력과 상권 후보를 연결하는 핵심 추천 모델 |
| 3 | `xgb_personalized_reranker` | sample trained | 추천 top-k 최종 정렬 | two-tower 후보를 사업 규칙과 1~4차 점수로 재정렬 |
| 4 | `subway_commercial_trend_score` | sample trained | 지하철 유입 신호 지도/카드 | 최근 실시간/준실시간 데이터로 보정 가능한 선행 지표 |
| 5 | `category_opportunity_score` | sample trained | 상권별 유망 업종 순위 | 업종 추천 UI의 직접 근거 |
| 6 | `demand_gap_detector` | sample trained | 잠재 수요 갭 badge | 뜨기 직전 후보 탐지에 유효하지만 공급/임대료 데이터 필요 |
| 7 | `trend_ensemble_calibrator` | sample trained | 종합 트렌드 점수 | 여러 점수 통합용. raw 검증 후 가치 상승 |
| 8 | `graph_market_influence_ranker` | sample trained | 상권 영향력/허브 점수 | 그래프 기반 설명력이 좋지만 공간/역 매핑 필요 |
| 9 | `market_anomaly_detector` | sample trained | 이상 급등/급락 경고 | 운영 모니터링과 리스크 알림에 적합 |
| 10 | `market_segment_clusterer` | sample trained | 상권 타입 tag | 추천 설명/필터용 보조 모델 |

## 모델 목록

| 차수 | 모델 | 기법 | 샘플 결과 |
| ---: | --- | --- | --- |
| 01 | `subway_commercial_trend_score` | XGBoost Regressor | RMSE `0.030651` |
| 02 | `sales_momentum_forecast` | XGBoost Classifier | macro F1 `0.622222` |
| 03 | `category_opportunity_score` | XGBoost Regressor | RMSE `0.091685` |
| 04 | `demand_gap_detector` | XGBoost Classifier | macro F1 `0.428571` |
| 05 | `survey_market_fit_two_tower` | TensorFlow Recommenders | hit@3 `1.0`, MRR `0.9` |
| 06 | `market_segment_clusterer` | KMeans | silhouette `0.131979` |
| 07 | `market_anomaly_detector` | IsolationForest | anomaly rate `0.08` |
| 08 | `trend_ensemble_calibrator` | GradientBoostingRegressor | RMSE `0.089755`, R2 `-18.440262` |
| 09 | `graph_market_influence_ranker` | NetworkX PageRank | top item `11110515:CS100004` |
| 10 | `xgb_personalized_reranker` | XGBoost Ranker | NDCG@3 `1.0` |

샘플 metric은 모델 품질이 아니라 파이프라인 검증 지표다. 특히 5~10차는 샘플 item 수가 작아서 ranking metric이 과대평가된다.

## 다음 검증

서비스 품질 검증에 필요한 입력:

```text
data/external/station_area_weights.csv
.sample 또는 raw 기반 설문 응답/선택 로그
행정동-업종 item catalog 200개 이상
positive/negative pair 1,000개 이상
```

공간 가중치가 들어오면 1차, 2차, 5차, 8차, 9차의 신뢰도가 동시에 올라간다.

## Raw 호환성 스모크 검증

6~10차 모델은 샘플 학습 후 `--data-mode raw` 실행까지 확인했다. 아래 값은 파이프라인 호환성 검증이며, 최종 문서 metric은 샘플 기준으로 유지한다.

| 모델 | raw rows | 핵심 결과 |
| --- | ---: | --- |
| `market_segment_clusterer` | 17,031 | silhouette `0.170410` |
| `market_anomaly_detector` | 49,727 | anomaly rate `0.049973` |
| `trend_ensemble_calibrator` | 17,031 | RMSE `0.001388`, R2 `0.998878` |
| `graph_market_influence_ranker` | 17,031 items | nodes `17,519`, edges `51,093` |
| `xgb_personalized_reranker` | 170,310 pairs | NDCG@3 `0.470392` |

## 참고 문서

- TensorFlow Recommenders: `https://www.tensorflow.org/recommenders`
- TensorFlow Recommenders Basic Retrieval: `https://www.tensorflow.org/recommenders/examples/basic_retrieval`
- XGBoost Python API: `https://xgboost.readthedocs.io/en/latest/python/python_api.html`
- scikit-learn Clustering: `https://scikit-learn.org/stable/modules/clustering.html`
- scikit-learn IsolationForest: `https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html`
- NetworkX PageRank: `https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.link_analysis.pagerank_alg.pagerank.html`
