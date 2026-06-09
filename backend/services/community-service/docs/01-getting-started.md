# Getting Started

## Prerequisites

로컬 개발 환경에는 다음이 필요하다.

- Java 21
- Docker / Docker Compose
- Google OAuth2 Client ID / Client Secret
- 선택: MinIO 또는 S3 호환 object storage
- 선택: LLM/Semantic upstream server

## 프로젝트 구조

```text
server/
 ├─ build.gradle
 ├─ settings.gradle
 ├─ src/main/java/com/example/server
 ├─ src/main/resources/application.yaml
 ├─ src/main/resources/db/migration
 ├─ src/test/java/com/example/server
 └─ docs
```

## 환경 변수

`application.yaml`은 `optional:file:.env[.properties]`를 import한다. 로컬에서는 `server/.env`를 만들거나 OS 환경 변수로 값을 주입한다.

```properties
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

S3_ENDPOINT=http://localhost:8900
S3_REGION=us-east-1
S3_BUCKET=pickle-post-images
S3_ACCESS_KEY=demo
S3_SECRET_KEY=demo12345
S3_PATH_STYLE_ACCESS=true
S3_PRESIGNED_URL_EXPIRATION_SECONDS=600

LLM_GATEWAY_BASE_URL=http://localhost:8000
LLM_GATEWAY_API_KEY=
LLM_GATEWAY_SEMANTIC_TIMEOUT=5s

POST_SEMANTIC_RELATED_DEFAULT_LIMIT=10
POST_SEMANTIC_RELATED_MAX_LIMIT=20
POST_SEMANTIC_RELATED_CACHE_TTL=P3D
```

## Google OAuth2 Redirect URI

Google Cloud Console의 OAuth2 Client 설정에 다음 redirect URI를 등록한다.

```text
http://localhost:8080/login/oauth2/code/google
```

프론트엔드 개발 서버는 현재 `SecurityConfig` 기준 다음 origin이 허용된다.

```text
http://localhost:5173
```

## 로컬 인프라 실행

워크스페이스 루트에 `compose.yaml`이 있는 구성이라면 다음처럼 실행한다.

```bash
docker compose -f compose.yaml up -d
```

서버가 기대하는 기본 포트는 다음과 같다.

| 구성 요소         | 기본값 |
| ----------------- | ------ |
| Spring Boot       | `8080` |
| PostgreSQL        | `5432` |
| Redis             | `6379` |
| RabbitMQ          | `5672` |
| S3/MinIO endpoint | `8900` |
| LLM Gateway       | `8000` |

## 빌드와 실행

```bash
cd server
./gradlew clean compileJava
./gradlew bootRun
```

Jar 빌드:

```bash
./gradlew build
java -jar build/libs/server-0.0.1-SNAPSHOT.jar
```

테스트를 제외하고 빠르게 빌드하려면:

```bash
./gradlew build -x test
```

## 테스트 실행

```bash
./gradlew test
```

테스트 리포트는 다음 경로에 생성된다.

```text
server/build/reports/tests/test/index.html
```

## 동작 확인

CSRF 토큰 발급:

```bash
curl -i http://localhost:8080/api/v1/auth/csrf
```

공개 게시글 조회:

```bash
curl -i http://localhost:8080/api/v1/posts
```

로그인이 필요한 API는 OAuth2 로그인 후 브라우저 세션 쿠키와 CSRF 토큰을 함께 보내야 한다.

## 흔한 문제

### Google OAuth 값이 없어서 서버가 뜨지 않음

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`를 설정한다.

### POST/PUT/DELETE가 403으로 실패함

세션 쿠키 인증에서는 CSRF 보호가 켜져 있다. 먼저 `/api/v1/auth/csrf`를 호출해 `XSRF-TOKEN` 쿠키를 받고, 이후 unsafe method 요청에 `X-XSRF-TOKEN` 헤더를 포함한다.

### RLS 때문에 JPA 저장/수정이 실패함

쓰기 트랜잭션에서 `DbSessionContext#setCurrentUserId`가 호출되어야 한다. PostgreSQL RLS 정책은 `app.current_user_id` 세션 설정을 기준으로 작동한다.

### RabbitMQ consumer가 실패 메시지를 계속 재시도함

`spring.rabbitmq.listener.simple.default-requeue-rejected=false` 설정을 확인한다. 실패 메시지는 DLX/DLQ로 보내는 것이 기본 방향이다.
