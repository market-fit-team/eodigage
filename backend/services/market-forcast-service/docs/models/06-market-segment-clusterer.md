# 06 market_segment_clusterer

## 문제

행정동-서비스업종 후보를 몇 개의 상권 타입으로 묶는다.

```text
area-category item features
-> KMeans
-> cluster_id
```

이 모델은 예측 모델이 아니다. 추천 결과를 설명하고 필터링하기 위한 보조 모델이다.

## 가설

상권 후보는 매출 규모, 지하철 유입, 업종 기회, 수요 갭, 창업 비용 proxy에 따라 자연스럽게 몇 가지 타입으로 나뉜다.

```text
high_subway_growth
stable_residential
high_gap_opportunity
premium_sales
low_cost_entry
```

## 학습

```text
model = sklearn.KMeans
features = item tower numeric features
```

샘플 실행:

```text
.venv/bin/python -m app.models.market_segment_clusterer.train --data-mode sample
```

결과:

```json
{
  "rows": 5,
  "n_clusters": 3,
  "silhouette_score": 0.131979
}
```

샘플 item이 5개뿐이라 silhouette는 품질 지표로 쓰지 않는다. raw item catalog에서 cluster label이 UI 설명에 유효한지 본다.

## UI

추천 카드에 타입 tag를 붙인다.

```text
역세권 성장형
안정 생활권형
저비용 진입형
잠재 수요 갭형
```

## artifact

```text
.artifacts/market_segment_clusterer/model.joblib
.artifacts/market_segment_clusterer/cluster_assignments.csv
```

