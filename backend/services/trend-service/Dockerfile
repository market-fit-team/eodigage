# 단일 공용 이미지: 운영 API와 학습/배치를 한 이미지로 돌린다.
# (배너 하나짜리라 이미지 분리 비용이 더 커서 의도적으로 합쳐 둔다.)
# - 운영: uvicorn으로 API 서빙(DB 배너 스냅샷만 읽음).
# - 학습/배치: 같은 이미지에서 1회 실행(추후 cron), .raw 추가 마운트:
#     docker compose run --rm -v "$PWD/backend/services/trend-service/.raw:/app/.raw" \
#         trend-service python -m app.batch --force
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# lightgbm 런타임 의존(OpenMP).
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
