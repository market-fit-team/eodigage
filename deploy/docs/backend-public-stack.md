# backend-public-stack

`deploy/compose/backend-public-stack.yml`은 프론트엔드를 제외한 공개 백엔드 스택을 한 번에 올린다.  
공개 포트는 `2081` 하나만 쓰고, Traefik이 host와 path로 서비스를 나눈다.

```text
market-fit.jongchoi.com:2080
-> 프론트엔드 별도 배포

api.market-fit.jongchoi.com:2081
-> Traefik
-> /api/profile     -> profile-service:3001
-> /api/echo        -> echo-service:3002
-> /api/market      -> market-service:8080
-> /api/franchise   -> franchise-service:8080
-> /api/community   -> community-service:8080
-> /api/onboarding  -> onboarding-service:8000
-> /api/agent       -> agent-service:2024
-> /api/post        -> post-service:8080

auth.market-fit.jongchoi.com:2081
-> Traefik
-> authentik-server:9000
```

## deploy/compose/backend-public-stack.yml

이 파일은 공개 게이트웨이, DB, 메시징, 스토리지, 애플리케이션 컨테이너를 한 compose에 둔다.

```yaml
services:
  traefik:
    ports:
      - "${API_PUBLIC_PORT:-2081}:2081"

  authentik-server:
    labels:
      - traefik.http.routers.authentik.rule=Host(`${AUTH_PUBLIC_HOST}`)

  market-service:
    labels:
      - traefik.http.routers.market.rule=Host(`${API_PUBLIC_HOST}`) && PathPrefix(`/api/market`)
```

`/api/*` prefix는 Traefik strip middleware로 내부 서비스 앞단에서 제거한다.  
예를 들어 `market-service` 컨트롤러는 `/api/v1/status`를 그대로 유지하고, 외부에서는 아래 주소로 보인다.

```text
GET /api/market/api/v1/status
-> market-service GET /api/v1/status
```

## 공개 경로

```text
/api/profile/user-profile
-> profile-service /user-profile

/api/echo/echo
-> echo-service /echo

/api/market/api/v1/status
-> market-service /api/v1/status

/api/franchise/api/v1/franchises
-> franchise-service /api/v1/franchises

/api/community/api/v1/posts
-> community-service /api/v1/posts

/api/onboarding/health
-> onboarding-service /health

/api/agent/openapi.json
-> agent-service /openapi.json

/api/agent/api/v1/llm/models
-> agent-service /api/v1/llm/models

/api/post/api/posts
-> post-service /api/posts
```

## deploy/.env.example

실제 배포 값은 `deploy/.env` 하나에 모은다.  
Auth host, API host, frontend origin, DB 비밀번호, OAuth secret, LLM key가 여기 들어간다.

```dotenv
FRONTEND_PUBLIC_ORIGIN=http://market-fit.jongchoi.com:2080
API_PUBLIC_ORIGIN=http://api.market-fit.jongchoi.com:2081
AUTH_PUBLIC_ORIGIN=http://auth.market-fit.jongchoi.com:2081

AUTHENTIK_CLIENT_ID=pickle-web
AUTHENTIK_CLIENT_SECRET=CHANGE_ME_AUTHENTIK_CLIENT_SECRET
AUTHENTIK_BETTER_AUTH_CALLBACK_URL=http://market-fit.jongchoi.com:2080/api/auth/oauth2/callback/authentik
```

`agent-service`는 `langgraph.json`의 `"env": ".env"`를 읽는다.  
compose는 `deploy/.env`를 `/app/.env`로 마운트해서 별도 agent 전용 env 파일을 만들지 않는다.

```json
{
  "env": ".env"
}
```

## deploy/authentik/pickle-web.yaml

프로덕션용 Authentik blueprint는 `deploy/authentik/pickle-web.yaml`에 따로 둔다.  
기존 `backend/authentik/blueprints/pickle-web.yaml`을 직접 건드리지 않고, 배포 쪽에서 공개 URL만 오버레이한다.

```yaml
redirect_uris:
  - url: !Env AUTHENTIK_BETTER_AUTH_CALLBACK_URL
    matching_mode: strict

launch_url: !Env FRONTEND_PUBLIC_ORIGIN
```

이 값 때문에 프론트 callback URL과 Authentik provider 설정이 `deploy/.env` 기준으로 맞춰진다.

## deploy/Makefile

배포 순서는 `gateway -> data -> restore-db -> services -> train-models`로 고정했다.

```make
up: gateway data restore-db services train-models
```

개별 단계는 아래 target으로 나뉜다.

```text
make gateway
-> Traefik만 시작

make data
-> PostgreSQL / Redis / RabbitMQ / MinIO 시작

make restore-db
-> market.dump / franchise.dump 복원

make services
-> Authentik + backend service 시작

make train-models
-> onboarding-service 모델 학습
```

덤프 복원과 모델 학습은 플래그로 생략할 수 있다.

```bash
SKIP_RESTORE=1 make up
SKIP_TRAIN=1 make up
SKIP_RESTORE=1 SKIP_TRAIN=1 make up
```

## deploy/scripts/restore-backend-db-market-franchise.sh

이 스크립트는 compose service 이름 `backend-db`에 붙어서 `pg_restore`를 실행한다.  
`docker exec backend-db ...`처럼 컨테이너 이름에 직접 의존하지 않는다.

```text
docker compose exec backend-db psql
-> market role 생성/갱신
-> franchise role 생성/갱신
-> market DB 생성
-> franchise DB 생성
-> pg_restore /dump/market.dump
-> pg_restore /dump/franchise.dump
```

덤프 파일은 `deploy/.local/backend-db-market-franchise/`에 둔다.

```text
deploy/.local/backend-db-market-franchise/market.dump
deploy/.local/backend-db-market-franchise/franchise.dump
```

## deploy/scripts/train-onboarding-models.sh

학습은 `onboarding-service` 컨테이너 안에서 두 스크립트를 직접 호출한다.

```bash
python -m app.models.onboarding_two_tower.train --epochs 20
python -m app.models.onboarding_category_tower.train --epochs 24 --data-mode sample
```

학습 결과는 host의 `.local` 아래로 남긴다.

```text
deploy/.local/onboarding-service-artifacts
-> /app/.artifacts
```

`SKIP_TRAIN=1`은 학습 명령만 생략한다.  
`onboarding-service`는 artifact가 없을 때 첫 runtime load에서 `train_and_save()`를 호출하므로, artifact가 비어 있으면 첫 요청에서 bootstrap 학습이 일어날 수 있다.

```text
load_model()
-> metadata.json 없음
-> train_and_save()
```

관련 코드는 아래 파일에 있다.

```text
backend/services/onboarding-service/app/models/onboarding_two_tower/train.py
backend/services/onboarding-service/app/models/onboarding_category_tower/train.py
```

## 주요 파일

- `deploy/compose/backend-public-stack.yml`
- `deploy/.env.example`
- `deploy/Makefile`
- `deploy/authentik/pickle-web.yaml`
- `deploy/postgres/init-service-databases.sh`
- `deploy/scripts/restore-backend-db-market-franchise.sh`
- `deploy/scripts/train-onboarding-models.sh`

## 참고 문서

- Docker Compose file reference: `https://docs.docker.com/reference/compose-file/`
- Traefik Docker provider: `https://doc.traefik.io/traefik/providers/docker/`
- Authentik blueprints: `https://docs.goauthentik.io/customize/blueprints/`
- PostgreSQL `pg_restore`: `https://www.postgresql.org/docs/current/app-pgrestore.html`
