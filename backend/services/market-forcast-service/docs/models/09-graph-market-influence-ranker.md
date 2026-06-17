# 09 graph_market_influence_ranker

## 문제

행정동, 업종, item 후보를 그래프로 연결해 영향력 높은 후보를 찾는다.

```text
area node
category node
item node
weighted edges
-> PageRank
-> graph_influence_score
```

## 가설

개별 점수는 높은데 연결성이 약한 후보와, 여러 강한 신호와 연결된 후보는 다르게 봐야 한다. 그래프 점수는 상권-업종 후보의 허브성과 전파 가능성을 보조 설명한다.

## 그래프

노드:

```text
area:{area_code}
category:{service_category_code}
item:{area_code}:{service_category_code}
```

엣지:

```text
item -> area      weight = 1 + subway_commercial_trend_score
item -> category  weight = 1 + category_opportunity_score
area -> category  weight = 1 + sales_momentum_up_probability
```

## 학습

```text
model = networkx.PageRank
```

샘플 실행:

```text
.venv/bin/python -m app.models.graph_market_influence_ranker.train --data-mode sample
```

결과:

```json
{
  "nodes": 11,
  "edges": 15,
  "item_count": 5,
  "top_item_id": "11110515:CS100004",
  "top_score": 0.072853
}
```

## UI

상권 상세에서 “영향력 높은 후보”나 “연결 신호 강함”으로 표시한다.

```text
그래프 영향력 높음
이 업종 후보는 상권 성장 신호와 업종 기회 신호가 함께 연결돼 있습니다.
```

## artifact

```text
.artifacts/graph_market_influence_ranker/graph_edges.json
.artifacts/graph_market_influence_ranker/item_scores.json
```

