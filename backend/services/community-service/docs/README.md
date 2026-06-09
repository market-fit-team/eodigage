# Server Docs

이 문서는 `server` 애플리케이션을 **Spring Boot 기반 백엔드 보일러플레이트**처럼 이해하고 확장할 수 있도록 정리한 문서 모음이다.

현재 서버는 Java 21, Spring Boot 3, Spring MVC, Spring Security OAuth2 Login, Redis Session, Spring Data JPA, PostgreSQL RLS, Flyway, RabbitMQ, SSE, S3 호환 Object Storage, Testcontainers를 사용한다.

## 문서 목록

| 문서                                                                     | 설명                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| [01-getting-started.md](./01-getting-started.md)                         | 로컬 실행, 환경 변수, 빌드, 테스트 시작 가이드           |
| [02-folder-structure.md](./02-folder-structure.md)                       | 현재 패키지 구조와 레이어별 책임                         |
| [03-api-contract.md](./03-api-contract.md)                               | `/api/v1` HTTP API 목록과 요청/응답 규칙                 |
| [04-security-oauth-session-csrf.md](./04-security-oauth-session-csrf.md) | OAuth2 Login, 세션, CSRF, CORS, 인증 에러 처리           |
| [05-persistence-jpa-flyway-rls.md](./05-persistence-jpa-flyway-rls.md)   | JPA, Flyway, PostgreSQL RLS, DB 세션 컨텍스트            |
| [06-redis-cache-session.md](./06-redis-cache-session.md)                 | Redis 세션, Spring Cache, semantic cache 전략            |
| [07-rabbitmq-events.md](./07-rabbitmq-events.md)                         | RabbitMQ exchange/queue/routing key, DLQ, 이벤트 흐름    |
| [08-sse-notifications.md](./08-sse-notifications.md)                     | SSE 알림 스트림과 Notification delivery 구조             |
| [09-media-s3.md](./09-media-s3.md)                                       | 이미지 업로드, S3 호환 저장소, media attachment 생명주기 |
| [10-scheduled-posts.md](./10-scheduled-posts.md)                         | 예약 게시글 도메인, 스케줄러, 발행 큐                    |
| [11-semantic-and-llm.md](./11-semantic-and-llm.md)                       | 관련 게시글, semantic indexing, LangGraph LLM gateway    |
| [12-testing.md](./12-testing.md)                                         | 테스트 전략, Testcontainers, MockMvc, RLS 테스트         |
| [13-development-guide.md](./13-development-guide.md)                     | 새 기능 추가 규칙, 코드 컨벤션, 리뷰 체크리스트          |
| [references.md](./references.md)                                         | 공식 문서와 참고 링크 모음                               |

## 큰 그림

```text
Client / React
  |
  | HTTP + Cookie Session + CSRF Header
  v
Spring MVC API (/api/v1/**)
  |
  +--> Security / OAuth2 Login / Redis Session
  |
  +--> Application & Core Services
          |
          +--> JPA + PostgreSQL + Flyway + RLS
          +--> Redis Cache
          +--> RabbitMQ async delivery
          +--> SSE live notification stream
          +--> S3-compatible media storage
          +--> Semantic upstream + LangGraph LLM gateway
```

## 이 서버가 보일러플레이트로 제공하는 것

- `/api/v1` 버전 prefix 기반 REST API 설계
- Google OAuth2 Login + Redis-backed session
- CSRF 토큰 발급 API와 cookie/session 기반 SPA 인증 패턴
- Spring Data JPA + Flyway SQL migration
- PostgreSQL Row Level Security 기반 DB 레벨 권한 방어선
- RabbitMQ 기반 비동기 알림/예약 발행 파이프라인
- SSE 기반 실시간 알림 스트림
- S3 호환 object storage 기반 이미지 업로드
- Redis cache 기반 관련 게시글 결과 캐싱
- LangGraph thread/run 기반 LLM gateway와 SSE relay
- MockMvc + Testcontainers 기반 통합 테스트 구조

## 설계 원칙

1. **HTTP 경계는 `api`에 둔다.** Controller와 HTTP request/response DTO는 `api/**`에 둔다.
2. **쓰기 모델은 `core`에 둔다.** Entity, command service, business rule, domain event는 `core/**`에 둔다.
3. **조회 조합은 `application`에 둔다.** QueryService, cursor codec, response assembler, SSE orchestration은 `application/**`에 둔다.
4. **기술 구현은 `infrastructure`에 둔다.** Repository, Redis, RabbitMQ, S3, external HTTP client, security config는 `infrastructure/**`에 둔다.
5. **API는 모두 `/api/v1` 아래에 둔다.** 버전 prefix가 없는 API를 추가하지 않는다.
6. **DB 권한은 애플리케이션 코드와 RLS 정책이 함께 지킨다.** 서비스 레벨 검증만 믿지 않고 DB row policy를 유지한다.
7. **비동기 처리는 실패 경로까지 설계한다.** RabbitMQ queue는 DLQ를 가진다.
8. **테스트는 실제 인프라와 가까운 환경을 사용한다.** PostgreSQL, RabbitMQ, MinIO 등은 Testcontainers로 검증한다.

## 빠른 시작

```bash
cd server
./gradlew test
./gradlew bootRun
```

자세한 실행 방법은 [01-getting-started.md](./01-getting-started.md)를 참고한다.
