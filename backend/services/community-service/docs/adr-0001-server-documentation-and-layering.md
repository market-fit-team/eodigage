# ADR 0001: Server Documentation and Layered Package Structure

## Status

Accepted

## Context

이 서버는 단순 CRUD 앱을 넘어서 다음 기능을 포함한다.

- OAuth2 Login + Redis Session
- Spring Data JPA + PostgreSQL RLS
- Flyway migration
- RabbitMQ async pipeline
- SSE notification stream
- S3-compatible media storage
- semantic/LLM upstream integration
- Testcontainers integration test

기능이 늘어나면서 `controller/service/repository/dto/entity` 같은 단순 파일 종류 중심 구조만으로는 DTO, service, infrastructure 역할이 섞이기 쉽다.

## Decision

서버는 다음 상위 레이어를 사용한다.

```text
api
application
core
infrastructure
```

각 레이어 안에서 도메인별 하위 패키지를 둔다.

```text
api/post
application/post
core/post
infrastructure/persistence/post
```

## Meaning

- `api`: HTTP boundary
- `application`: query/use-case orchestration
- `core`: entity, command behavior, business rule, domain event, port
- `infrastructure`: DB, Redis, RabbitMQ, S3, external HTTP, security/config

## Consequences

장점:

- HTTP DTO와 외부 upstream DTO를 분리할 수 있다.
- JPA/RabbitMQ/S3/Redis 같은 기술 구현이 한 곳에 모인다.
- QueryService와 CommandService의 책임이 구분된다.
- RLS, RabbitMQ, SSE 같은 인프라 문서화가 쉬워진다.

단점:

- 하나의 도메인 변경 시 여러 상위 폴더를 봐야 한다.
- `core`와 `application`의 역할을 문서로 명확히 유지해야 한다.
- 완전한 DDD/Hexagonal Architecture가 아니므로 과도한 용어 사용을 피해야 한다.

## Rules

- API는 `/api/v1` prefix를 사용한다.
- Controller는 repository를 직접 호출하지 않는다.
- Entity는 HTTP DTO를 의존하지 않는다.
- 외부 upstream DTO는 `infrastructure/http/**/dto`에 둔다.
- RabbitMQ message는 `infrastructure/messaging/**`에 둔다.
- RLS가 필요한 write service는 `DbSessionContext`를 설정한다.
- 문서 변경이 필요한 기능 추가 시 `docs`를 함께 갱신한다.
