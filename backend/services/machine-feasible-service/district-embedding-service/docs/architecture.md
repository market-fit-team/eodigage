# district-embedding-service

## `app/train.py`

행정동 상권 feature를 PCA 8차원 embedding으로 만들고 `NearestNeighbors` index를 학습한다.

```text
generate_mock_data() 240 rows
-> StandardScaler
-> PCA(n_components=8)
-> NearestNeighbors(metric="cosine")
```

## `app/main.py`

```text
GET /health
POST /train
GET /evaluation
GET /catalog
POST /similar
POST /predict
```

## 주요 파일

- `app/train.py`
- `app/main.py`

## 참고 문서

- https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html
- https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html
