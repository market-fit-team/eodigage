# 10 xgb_personalized_reranker

## 문제

5차 two-tower가 뽑은 후보를 XGBoost Ranker로 최종 재정렬한다.

```text
two-tower candidates
+ survey fit features
+ market scores
-> XGBRanker
-> final ranking
```

## 가설

two-tower는 후보 검색에 좋지만, 예산 초과, 제외 업종, 위험 선호 같은 hard/soft constraint를 최종 순위에 반영하는 데는 별도 reranker가 필요하다.

## 학습

```text
model = xgboost.XGBRanker
objective = rank:pairwise
group = survey_response_id
label = L0 synthetic label
```

샘플 실행:

```text
.venv/bin/python -m app.models.xgb_personalized_reranker.train --data-mode sample
```

결과:

```json
{
  "rows": 50,
  "groups": 10,
  "mean_ndcg_at_3": 1.0,
  "positive_pairs": 24
}
```

item이 5개뿐이라 NDCG는 과대평가된다. 하지만 `survey_response_id`별 group ranking pipeline은 검증됐다.

## UI

최종 추천 순위는 10차 모델 결과를 사용한다.

```text
1차 후보 검색: two-tower
최종 정렬: xgb_personalized_reranker
```

## artifact

```text
.artifacts/xgb_personalized_reranker/model.joblib
```

