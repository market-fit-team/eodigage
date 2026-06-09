# AGENTS.md — server

이 파일은 서버 코드를 수정하는 AI 에이전트가 먼저 읽어야 하는 최소 지침이다.  
상세한 설명은 이미 `server/docs`에 있으므로, 여기에는 프로젝트 구조와 자주 깨지는 금지선만 적는다.

## 프로젝트 개요

`server`는 Java 21 / Spring Boot 3 기반 백엔드다.

주요 구성은 다음과 같다.

- Spring MVC REST API
- Google OAuth2 Login + Redis-backed Spring Session
- Cookie CSRF 기반 SPA 인증
- Spring Data JPA + PostgreSQL + Flyway
- PostgreSQL Row Level Security
- Redis cache
- RabbitMQ 비동기 이벤트 / DLQ
- SSE 알림 스트림
- S3 호환 이미지 저장소
- LLM / semantic upstream 연동
- MockMvc + Testcontainers 테스트

서비스 API는 `/api/v1/**` 아래에 둔다.  
OpenAPI 문서는 `/v3/api-docs`에서 노출된다. `/v3/api-docs`는 서비스 API 버전 prefix가 아니다.

## 실행 / 검증 명령

서버 디렉터리 기준으로 실행한다.

```bash
./gradlew clean compileJava
./gradlew test
./gradlew bootRun
```

로컬 인프라는 루트의 `compose.yaml`을 사용한다.

```bash
docker compose -f ../compose.yaml up -d
```

## 문서 위치

상세 규칙은 `server/docs/README.md`에서 주제별 문서를 찾아 확인한다.

자주 봐야 하는 문서는 다음이다.

- 구조: `docs/02-folder-structure.md`
- API 계약: `docs/03-api-contract.md`
- 인증 / 세션 / CSRF: `docs/04-security-oauth-session-csrf.md`
- JPA / Flyway / RLS: `docs/05-persistence-jpa-flyway-rls.md`
- Redis: `docs/06-redis-cache-session.md`
- RabbitMQ: `docs/07-rabbitmq-events.md`
- SSE 알림: `docs/08-sse-notifications.md`
- 미디어 / S3: `docs/09-media-s3.md`
- 예약 게시글: `docs/10-scheduled-posts.md`
- LLM / semantic: `docs/11-semantic-and-llm.md`
- 테스트: `docs/12-testing.md`
- OpenAPI: `docs/14-openapi.md`

## 패키지 구조

서버 코드는 `com.example.server` 아래에서 네 개의 큰 레이어로 나뉜다.

```text
api
application
core
infrastructure
```

### `api`

HTTP 경계다.

여기에 둔다.

- Controller
- HTTP request / response DTO
- HTTP validation
- HTTP error response 변환

Controller는 요청을 받고, 검증하고, 적절한 service를 호출하는 경계 역할만 한다.

### `application`

조회와 유스케이스 조합 레이어다.

여기에 둔다.

- QueryService
- 여러 repository / 외부 데이터를 조합하는 읽기 흐름
- cursor / pagination 조합
- SSE orchestration
- response 조립 로직

상태 변경을 중심으로 하는 비즈니스 규칙은 여기에 두지 않는다.

### `core`

비즈니스 모델과 쓰기 흐름의 중심이다.

여기에 둔다.

- Entity
- command service
- domain event
- command value object
- 핵심 business rule

이 프로젝트는 실용적인 구조를 택하고 있어서 `core` command service가 Spring Data repository를 직접 주입하는 방식을 허용한다. 이 점을 무시하고 억지로 순수 hexagonal 구조로 바꾸지 않는다.

### `infrastructure`

기술 구현 레이어다.

여기에 둔다.

- JPA repository / query projection
- Redis 설정과 cache adapter
- RabbitMQ publisher / consumer / config
- S3 storage adapter
- 외부 HTTP client
- Security config
- DB session context

## 기본 흐름

쓰기 흐름은 보통 다음 방향이다.

```text
api -> core -> infrastructure
```

읽기 흐름은 보통 다음 방향이다.

```text
api -> application -> infrastructure
```

이 방향을 깨지 않는다. 특히 Controller가 repository를 직접 호출하는 구조로 만들지 않는다.

## AI가 자주 실수하지만 절대 하면 안 되는 것

### 1. 재사용 가능한 로직을 둘로 갈라놓지 말 것

일반 게시글 생성과 예약 게시글 발행은 같은 내부 생성 규칙을 타야 한다.

핵심은 `PostDraft` 이후의 생성 경로를 공유하는 것이다.

- 일반 게시글 생성
- 예약 게시글이 실제 발행되는 흐름

둘 다 content / media validation, 미디어 attach, cache invalidation, notification, semantic indexing 규칙이 어긋나면 안 된다.

예약 게시글 쪽에 비슷한 생성 로직을 복사하거나, 일반 게시글과 다른 validation을 따로 만들지 않는다.

### 2. HTTP DTO를 core로 끌고 들어가지 말 것

`CreatePostRequest` 같은 HTTP request DTO는 `api`의 소유다.  
`core`는 HTTP 요청 모양을 알면 안 된다.

`core`에는 `PostDraft` 같은 내부 command value object를 넘긴다.

금지한다.

```text
core -> api dto 의존
entity -> api dto 의존
entity -> web/session/security 세부 구현 의존
```

### 3. OpenAPI 타입을 추론에 맡기지 말 것

프론트엔드는 Orval로 OpenAPI 타입을 생성한다.  
서버 응답 타입이 부정확하면 클라이언트 타입도 틀어진다.

응답 DTO에서 계약상 항상 포함되는 필드는 `requiredMode`를 명시한다.  
항상 포함되지만 값이 null일 수 있는 필드는 required와 nullable을 함께 명시한다.

예시 성격의 필드:

- `parentId`
- `publishedPostId`
- 이미지 `width`, `height`, `altText`

서버 내부 파라미터는 OpenAPI에 노출하지 않는다. 이런 값은 `@Parameter(hidden = true)`를 유지한다.

### 4. `/api/v1` 없는 API를 만들지 말 것

서비스 API는 `/api/v1/**` 아래에 둔다.

예외적으로 `/v3/api-docs/**`는 OpenAPI 문서 엔드포인트다. 이 둘을 섞어서 이해하지 않는다.

### 5. DB 변경을 Entity 수정으로 끝내지 말 것

PostgreSQL + Flyway + RLS를 사용한다.

DB 스키마 변경은 Entity만 수정해서 끝내면 안 된다.

확인할 것:

- Flyway migration 필요 여부
- RLS policy 필요 여부
- index 필요 여부
- `ddl-auto=validate` 통과 여부
- write transaction에서 `DbSessionContext#setCurrentUserId` 필요 여부

RLS 검증을 H2로 대체하지 않는다. RLS 관련 테스트는 PostgreSQL에 가까운 환경에서 확인한다.

### 6. 비동기 흐름에서 실패 경로를 생략하지 말 것

RabbitMQ 흐름에는 실패와 재시도가 있다.

consumer를 추가하거나 메시지 schema를 바꿀 때는 다음을 함께 본다.

- queue / exchange / routing key
- DLQ
- retry 가능성
- idempotency
- transaction commit 이후 이벤트 발행 필요 여부

성공 경로만 보고 publisher/consumer를 추가하지 않는다.

### 7. Entity를 API 응답으로 직접 내보내지 말 것

Controller는 Entity를 그대로 반환하지 않는다.  
HTTP response DTO를 통해 API 계약을 분리한다.

Entity는 HTTP, Redis, RabbitMQ, S3, session, security 세부 구현을 몰라야 한다.

### 8. `service`, `dto`, `util`, `common` 잡동사니를 만들지 말 것

이 프로젝트는 파일 종류별 상위 폴더 구조가 아니다.

새 파일은 먼저 어느 경계에 속하는지 결정한다.

- HTTP 경계면 `api`
- 읽기 조합이면 `application`
- 비즈니스 쓰기 규칙이면 `core`
- 기술 구현이면 `infrastructure`

`common`이나 `util`에 비즈니스 코드를 숨기지 않는다.

### 9. QueryService와 CommandService를 섞지 말 것

조회 조합과 상태 변경을 한 서비스에 몰아넣지 않는다.

- 읽기: `application` QueryService
- 쓰기: `core` CommandService

예를 들어 피드 조회, 관련 게시글 조회, cursor 목록 조합은 `application` 쪽 성격이다.  
게시글 생성, 수정, 삭제, 예약 발행, 미디어 attach 같은 상태 변경은 `core` 쪽 성격이다.

### 10. 보안 경계를 프론트 신뢰로 대체하지 말 것

클라이언트가 보낸 값은 신뢰하지 않는다.

특히 다음은 서버에서 최종 검증한다.

- 인증 사용자
- 작성자 권한
- media attachment 소유권과 상태
- 예약 게시글 소유권
- LLM tool approval / allowed tool 정책
- 파일 업로드 제한

CSRF 보호가 켜져 있으므로 unsafe method는 CSRF token 흐름을 깨지 않게 유지한다.
