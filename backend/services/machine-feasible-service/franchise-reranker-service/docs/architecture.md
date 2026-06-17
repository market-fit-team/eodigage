# franchise-reranker-service

## `app/train.py`

`XGBRanker`가 투타워 후보를 재정렬한다.

```text
queries 180
candidates per query 12
rows 2160
-> XGBRanker.fit(objective="rank:ndcg")
```

## `app/main.py`

```text
GET /health
POST /train
GET /evaluation
POST /predict
POST /rerank
```

## 주요 파일

- `app/train.py`
- `app/main.py`

## 참고 문서

- https://xgboost.readthedocs.io/en/latest/python/sklearn_estimator.html
