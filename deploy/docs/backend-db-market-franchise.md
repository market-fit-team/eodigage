# backend-db-market-franchise

`deploy/compose/backend-db-market-franchise.oci.yml`은 OCI VM에서 `backend-db` 하나를 띄운다.  
`market-service`, `franchise-service`가 같이 쓰는 PostgreSQL 17 + PostGIS 3.5 대상이다.

```text
deploy/
+ compose/backend-db-market-franchise.oci.yml
+ scripts/restore-backend-db-market-franchise.sh
+ .local/backend-db-market-franchise/market.dump
+ .local/backend-db-market-franchise/franchise.dump
```

## 덤프 생성

로컬 `backend-db`에서 덤프를 다시 만들 때는 `deploy/.local/backend-db-market-franchise/`로 바로 쓴다.

```bash
docker exec backend-db pg_dump -U postgres -Fc -d market \
  --exclude-table-data=spatial_ref_sys \
  > deploy/.local/backend-db-market-franchise/market.dump

docker exec backend-db pg_dump -U postgres -Fc -d franchise \
  > deploy/.local/backend-db-market-franchise/franchise.dump
```

`market.dump`는 `spatial_ref_sys` 데이터를 제외한다.  
복원 시 `CREATE EXTENSION postgis`가 표준 SRID를 다시 채운다.

## deploy/compose/backend-db-market-franchise.oci.yml

이 파일은 덤프를 `/dump`에 읽기 전용으로 마운트한다.

```yaml
services:
  backend-db:
    image: postgis/postgis:17-3.5-alpine
    ports:
      - "5432:5432"
    volumes:
      - ../.local/backend-db-market-franchise/market.dump:/dump/market.dump:ro
      - ../.local/backend-db-market-franchise/franchise.dump:/dump/franchise.dump:ro
```

기동 명령은 파일명을 그대로 쓴다.

```bash
docker compose -f deploy/compose/backend-db-market-franchise.oci.yml up -d
```

## deploy/scripts/restore-backend-db-market-franchise.sh

이 스크립트는 `market`, `franchise` 롤과 DB를 준비한 뒤 `pg_restore`를 실행한다.

```bash
BACKEND_DB_POSTGRES_PASSWORD=<postgres 비밀번호> \
MARKET_DB_PASSWORD=<market 비밀번호> \
FRANCHISE_DB_PASSWORD=<franchise 비밀번호> \
bash deploy/scripts/restore-backend-db-market-franchise.sh
```

standalone compose를 쓸 때는 `STACK_FILE`만 바꿔서 같은 스크립트를 그대로 쓴다.

```bash
STACK_FILE=deploy/compose/backend-db-market-franchise.oci.yml \
BACKEND_DB_POSTGRES_PASSWORD=<postgres 비밀번호> \
MARKET_DB_PASSWORD=<market 비밀번호> \
FRANCHISE_DB_PASSWORD=<franchise 비밀번호> \
bash deploy/scripts/restore-backend-db-market-franchise.sh
```

실행 흐름은 아래 순서다.

```text
role 생성/비밀번호 갱신
-> market DB 생성
-> franchise DB 생성
-> pg_restore -d market /dump/market.dump
-> pg_restore -d franchise /dump/franchise.dump
-> row 수 확인
```

## 서비스 연결

`backend/services/market-service/src/main/resources/application.yaml`과  
`backend/services/franchise-service/src/main/resources/application.yaml`은 아래 연결값을 받는다.

```env
DB_HOST=<OCI VM IP 또는 DNS>
DB_PORT=5432

# market-service
DB_NAME=market
DB_USERNAME=market
DB_PASSWORD=<MARKET_DB_PASSWORD>

# franchise-service
DB_NAME=franchise
DB_USERNAME=franchise
DB_PASSWORD=<FRANCHISE_DB_PASSWORD>
```

## 주요 파일

- `deploy/compose/backend-db-market-franchise.oci.yml`
- `deploy/scripts/restore-backend-db-market-franchise.sh`
- `backend/services/market-service/src/main/resources/application.yaml`
- `backend/services/franchise-service/src/main/resources/application.yaml`

## 참고 문서

- Docker Compose file reference: `https://docs.docker.com/reference/compose-file/`
- PostgreSQL `pg_dump`: `https://www.postgresql.org/docs/current/app-pgdump.html`
- PostgreSQL `pg_restore`: `https://www.postgresql.org/docs/current/app-pgrestore.html`
