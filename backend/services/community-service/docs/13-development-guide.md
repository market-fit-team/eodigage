# Development Guide

이 문서는 서버에 새 기능을 추가하거나 기존 기능을 수정할 때 지켜야 하는 실용 규칙이다.

## 기본 원칙

1. API는 `/api/v1` 아래에 둔다.
2. Controller는 repository를 직접 호출하지 않는다.
3. Entity를 HTTP 응답으로 직접 반환하지 않는다.
4. DB schema 변경은 Flyway migration으로만 한다.
5. RLS 대상 table은 service validation과 DB policy를 함께 설계한다.
6. RabbitMQ message는 실패 경로와 DLQ를 함께 설계한다.
7. Redis cache는 TTL과 invalidation 전략이 있어야 한다.
8. 외부 upstream DTO는 `api/dto`에 두지 않는다.
9. 테스트 없는 리팩토링은 하지 않는다.

## 새 도메인 추가 순서

예를 들어 `bookmark` 기능을 추가한다.

### 1. Entity와 migration

```text
core/bookmark/Bookmark.java
infrastructure/persistence/bookmark/BookmarkRepository.java
src/main/resources/db/migration/V14__create_bookmarks.sql
```

### 2. Command service

```text
core/bookmark/BookmarkCommandService.java
```

쓰기 작업은 ownership, 중복, 상태 전이를 여기서 처리한다.

### 3. Query service가 필요하면 application에 추가

```text
application/bookmark/BookmarkQueryService.java
```

조회 결과를 DTO로 조합하거나 projection을 사용한다.

### 4. API 추가

```text
api/bookmark/BookmarkController.java
api/bookmark/dto/BookmarkResponse.java
```

### 5. 테스트 추가

```text
src/test/java/com/example/server/api/bookmark/BookmarkApiTest.java
src/test/java/com/example/server/db/BookmarkRlsPolicyTest.java
```

## Controller 규칙

Controller가 해도 되는 일:

- URL mapping
- request validation
- authentication principal 수신
- current user 조회
- service 호출
- HTTP status 결정

Controller가 하면 안 되는 일:

- repository 직접 호출
- EntityManager 직접 사용
- 비즈니스 규칙 구현
- RabbitMQ/S3/Redis 직접 호출
- Entity 그대로 반환

## Service 규칙

### Command Service

쓰기와 상태 전이를 담당한다.

예:

```text
core/post/PostCommandService.java
core/postlike/PostLikeCommandService.java
core/media/MediaCommandService.java
core/notification/NotificationCommandService.java
```

규칙:

- `@Transactional` 경계를 명확히 한다.
- RLS가 필요한 경우 `DbSessionContext#setCurrentUserId`를 먼저 호출한다.
- Entity method를 사용해 상태를 바꾼다.
- cache eviction, event publish는 command 성공 경로에서 처리한다.

### Query Service

읽기 조합을 담당한다.

예:

```text
application/post/query/PostQueryService.java
application/notification/NotificationQueryService.java
application/semantic/RelatedPostsQueryService.java
```

규칙:

- 가능하면 read projection/view를 사용한다.
- pagination/cursor 정책을 한 곳에 모은다.
- Entity graph를 무분별하게 노출하지 않는다.
- API 응답에 필요한 형태로 조합한다.

## DTO 규칙

Request DTO:

- HTTP 요청 body/query/form을 표현한다.
- validation annotation을 사용한다.
- `api/<domain>/dto`에 둔다.

Response DTO:

- HTTP 응답 형태를 표현한다.
- record 사용을 권장한다.
- `api/<domain>/dto`에 둔다.

External DTO:

- 외부 LLM/Semantic/S3 등 upstream API용 DTO다.
- `infrastructure/http/<domain>/dto`에 둔다.

Message DTO:

- RabbitMQ message payload다.
- `infrastructure/messaging/<domain>`에 둔다.

Domain Event:

- 내부 도메인 사건이다.
- `core/<domain>/event`에 둔다.

## Entity 규칙

Entity는 단순 getter/setter bag이 아니어야 한다.

좋은 예:

```java
Post post = Post.createRoot(content, user);
post.updateContent(content);
post.softDelete();
```

나쁜 예:

```java
post.setDeletedAt(Instant.now());
post.setContent(null);
```

규칙:

- 생성자는 protected로 막고 정적 factory를 제공한다.
- 상태 변경은 의미 있는 method로 표현한다.
- 외부 계층 DTO를 의존하지 않는다.
- HTTP, Redis, RabbitMQ, S3를 알지 않는다.

## Repository 규칙

Repository는 DB 접근만 담당한다.

- 복잡한 읽기 query는 `infrastructure/persistence/<domain>/query`로 분리한다.
- projection interface는 query repository 옆에 둔다.
- business rule을 repository method 이름에 숨기지 않는다.
- N+1 문제가 있으면 fetch join/entity graph/projection을 명시적으로 사용한다.

## Event 규칙

내부 Spring event:

- transaction commit 이후 실행이 필요한 경우 `@TransactionalEventListener`를 사용한다.
- event payload는 필요한 id 중심으로 작게 유지한다.

RabbitMQ event:

- durable queue를 사용한다.
- DLQ를 둔다.
- message schema 변경을 조심한다.
- consumer idempotency를 보장한다.

## Config 규칙

전역 config:

```text
infrastructure/security
infrastructure/cache/config
infrastructure/messaging/config
infrastructure/storage/config
```

도메인 전용 config:

```text
infrastructure/http/semantic/config
```

하드코딩하지 말고 `application.yaml` + env variable로 뺀다.

## 코드 리뷰 체크리스트

### 구조

- [ ] 파일이 올바른 레이어에 있는가?
- [ ] 새 패키지가 기존 naming과 일관적인가?
- [ ] DTO가 쓰이는 경계 옆에 있는가?
- [ ] 외부 기술 코드가 core로 들어오지 않았는가?

### API

- [ ] `/api/v1` prefix를 사용했는가?
- [ ] request validation이 있는가?
- [ ] 인증/인가 정책이 테스트되었는가?
- [ ] 에러 응답이 일관적인가?

### Persistence

- [ ] Flyway migration이 있는가?
- [ ] `ddl-auto=validate`가 통과하는가?
- [ ] RLS가 필요한 table인가?
- [ ] index가 필요한 query인가?

### Async / Cache

- [ ] RabbitMQ 실패 경로가 있는가?
- [ ] DLQ가 있는가?
- [ ] cache invalidation이 있는가?
- [ ] TTL이 적절한가?

### Test

- [ ] unit test가 있는가?
- [ ] API integration test가 있는가?
- [ ] DB/RLS test가 있는가?
- [ ] external client test가 있는가?

## 나쁜 냄새

- `PostService` 같은 하나의 service가 media, notification, semantic, scheduling을 모두 직접 처리한다.
- FQCN을 코드 본문에 반복해서 쓴다.
- `dto` 폴더에 HTTP DTO, upstream DTO, message DTO가 섞인다.
- `common` 또는 `util`에 비즈니스 코드가 들어간다.
- Controller가 Entity를 그대로 반환한다.
- 테스트에서 H2로 PostgreSQL RLS를 검증하려고 한다.
- 새 migration 없이 Entity만 바꾼다.

## 문서 작성 규칙

새 기술/기능을 추가하면 `docs`도 함께 갱신한다.

- API 추가: `03-api-contract.md`
- DB/RLS 변경: `05-persistence-jpa-flyway-rls.md`
- RabbitMQ 변경: `07-rabbitmq-events.md`
- SSE 변경: `08-sse-notifications.md`
- S3/media 변경: `09-media-s3.md`
- 테스트 전략 변경: `12-testing.md`
- 참고 링크 추가: `references.md`
